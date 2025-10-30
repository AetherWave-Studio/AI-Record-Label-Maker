// KIE.ai API Client Wrapper
// Provides a fal.ai-style subscribe() interface for KIE.ai models
// Handles internal polling so clients get a clean async/await experience

import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import FormData from "form-data";

// KIE.ai API configuration
const KIE_API_BASE = "https://api.kie.ai/api/v1";
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max (200 * 3s = 600s)

// Proxy configuration (optional)
// Set WEBSHARE_PROXY env var to: http://username:password@proxy.webshare.io:80
const PROXY_URL = process.env.WEBSHARE_PROXY;
const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

/**
 * Upload a base64 image to ImgBB (free image hosting)
 * Returns a publicly accessible URL that can be used with SORA 2
 *
 * @param base64Data Base64-encoded image data (with or without data:image prefix)
 * @param apiKey Not used for ImgBB, but kept for compatibility
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToKie(base64Data: string, apiKey: string): Promise<string> {
  try {
    console.log('Uploading image to ImgBB (free hosting)...');

    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

    console.log(`Image size: ${base64Content.length} chars (base64)`);

    // ImgBB API - free tier, no IP restrictions
    // Get API key from environment (free key from https://api.imgbb.com/)
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      throw new Error('IMGBB_API_KEY environment variable not set. Get a free key from https://api.imgbb.com/');
    }
    const uploadUrl = `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`;

    const formData = new URLSearchParams();
    formData.append('image', base64Content);
    formData.append('name', `sora2-${Date.now()}`);

    console.log(`Uploading to ImgBB...`);

    const uploadResponse = await nodeFetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      agent: proxyAgent as any,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`ImgBB upload failed (${uploadResponse.status}):`, errorText);
      throw new Error(`Failed to upload image to ImgBB: ${errorText}`);
    }

    const uploadResult: any = await uploadResponse.json();
    console.log('Upload response status:', uploadResult.success);

    // Extract the public URL from the response
    const publicUrl = uploadResult.data?.url || uploadResult.data?.display_url;

    if (!publicUrl) {
      console.error('No public URL in upload response:', uploadResult);
      throw new Error('No public URL returned from ImgBB upload');
    }

    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return publicUrl;

  } catch (error: any) {
    console.error('Image upload error:', error);
    throw error;
  }
}

export interface KieTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status?: string;
  };
}

export interface KieStatusResponse {
  code: number;
  message?: string;
  msg?: string;
  data: {
    taskId: string;
    model?: string;
    state?: 'pending' | 'processing' | 'success' | 'failed';
    status?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
    param?: string;
    resultJson?: string; // JSON string containing resultUrls array
    failCode?: string;
    failMsg?: string;
    completeTime?: number;
    createTime?: number;
    updateTime?: number;
    videoUrl?: string;
    video_url?: string;
    imageUrl?: string;
    image_url?: string;
    result?: any;
    progress?: number;
    error?: string;
  };
}

export interface KieSubscribeOptions {
  model: string; // e.g., 'veo3_fast', 'sora2', 'sora2_pro', etc.
  input: any; // Model-specific input parameters
  apiKey: string;
  logs?: boolean;
  callbackUrl?: string; // Optional callback URL
  onQueueUpdate?: (update: { status: string; progress?: number }) => void;
}

export interface KieResult {
  status: 'complete' | 'failed';
  videoUrl?: string;
  imageUrl?: string;
  data?: any;
  error?: string;
}

/**
 * Poll a KIE.ai task until completion
 * @param taskId The task ID to poll
 * @param apiKey KIE.ai API key
 * @param endpoint Status check endpoint (e.g., '/jobs/query' or '/veo/query')
 * @param onUpdate Optional callback for status updates
 * @returns Final result when task completes
 */
async function pollTaskStatus(
  taskId: string,
  apiKey: string,
  endpoint: string,
  onUpdate?: (update: { status: string; progress?: number }) => void
): Promise<KieResult> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;

    try {
      // /jobs/recordInfo uses GET with taskId as query parameter
      const statusResponse = await nodeFetch(`${KIE_API_BASE}${endpoint}?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        agent: proxyAgent as any
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`KIE.ai status check failed (${statusResponse.status}):`, errorText);

        // If we get a 4xx error, stop polling
        if (statusResponse.status >= 400 && statusResponse.status < 500) {
          return {
            status: 'failed',
            error: `API error: ${errorText}`
          };
        }

        // For 5xx errors, continue polling
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const statusData: any = await statusResponse.json();

      // Debug: Log the full response structure once
      if (attempts === 1) {
        console.log('KIE.ai API response structure:', JSON.stringify(statusData, null, 2));
      }

      if (statusData.code !== 200) {
        console.error('KIE.ai returned error code:', statusData);

        // Check for FAILED in both status and state fields
        const taskState = statusData.data?.status || statusData.data?.state;
        if (taskState === 'FAILED' || taskState === 'failed') {
          return {
            status: 'failed',
            error: statusData.data.error || statusData.msg || 'Task failed'
          };
        }

        // Otherwise continue polling
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Check both 'status' and 'state' fields (KIE.ai might use either)
      const taskStatus = statusData.data?.status || statusData.data?.state;
      const progress = statusData.data?.progress;

      // Call update callback if provided
      if (onUpdate) {
        onUpdate({ status: taskStatus, progress });
      }

      console.log(`KIE.ai task ${taskId} status: ${taskStatus}${progress ? ` (${progress}%)` : ''}`);

      // Check if task is complete (check both uppercase and lowercase)
      if (taskStatus === 'SUCCESS' || taskStatus === 'success') {
        // Parse resultJson if it exists (it's a JSON string)
        let resultData = null;
        if (statusData.data.resultJson) {
          try {
            resultData = JSON.parse(statusData.data.resultJson);
          } catch (e) {
            console.error('Failed to parse resultJson:', e);
          }
        }

        // Extract video/image URL from response
        // Priority: resultUrls > videoUrl > video_url
        const videoUrl = resultData?.resultUrls?.[0] ||
                        statusData.data.videoUrl ||
                        statusData.data.video_url ||
                        statusData.data.result?.videoUrl ||
                        statusData.data.result?.video_url;

        const imageUrl = resultData?.resultUrls?.[0] ||
                        statusData.data.imageUrl ||
                        statusData.data.image_url ||
                        statusData.data.result?.imageUrl ||
                        statusData.data.result?.image_url;

        if (!videoUrl && !imageUrl) {
          console.error('Task completed but no media URL found:', statusData);
          return {
            status: 'failed',
            error: 'Task completed but no media URL found in response',
            data: statusData.data
          };
        }

        return {
          status: 'complete',
          videoUrl,
          imageUrl,
          data: statusData.data
        };
      }

      if (taskStatus === 'FAILED' || taskStatus === 'failed') {
        return {
          status: 'failed',
          error: statusData.data.failMsg || statusData.data.error || 'Task failed without error message'
        };
      }

      // Task still processing, wait and poll again
      await sleep(POLL_INTERVAL_MS);

    } catch (error: any) {
      console.error('Error polling KIE.ai task status:', error.message);

      // If we're near the end of our attempts, give up
      if (attempts >= MAX_POLL_ATTEMPTS - 3) {
        return {
          status: 'failed',
          error: `Polling failed: ${error.message}`
        };
      }

      // Otherwise wait and try again
      await sleep(POLL_INTERVAL_MS);
    }
  }

  // Max attempts reached
  return {
    status: 'failed',
    error: `Task did not complete within ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`
  };
}

/**
 * Subscribe to a KIE.ai model generation task
 * Similar to fal.subscribe() but for KIE.ai
 * Handles task creation and polling internally
 *
 * @param options Model, input, and API key
 * @returns Promise that resolves when generation is complete
 */
export async function kieSubscribe(options: KieSubscribeOptions): Promise<KieResult> {
  const { model, input, apiKey, logs = false, onQueueUpdate } = options;

  if (!apiKey) {
    throw new Error('KIE.ai API key is required');
  }

  // All KIE.ai models use the same /jobs endpoints
  // The model parameter in the request body determines which model is used
  const createEndpoint = '/jobs/createTask';
  const statusEndpoint = '/jobs/recordInfo';

  // Map our internal model names to KIE.ai's expected format
  // Different models have different naming conventions:
  // - SORA 2: Uses "text-to-video" or "image-to-video"
  // - VEO 3: Uses "TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", or "REFERENCE_2_VIDEO"

  const kieModelBaseMap: Record<string, string> = {
    'sora2': 'sora-2',
    'sora2_pro': 'sora-2-pro',
    'sora2_pro_hd': 'sora-2-pro-hd',
    'veo3_fast': 'veo-3-fast',
  };

  const modelBase = kieModelBaseMap[model] || model;
  let kieModelName: string;

  // Determine the correct model name based on model type and input
  if (model.startsWith('veo')) {
    // VEO 3 models use uppercase with underscores
    const hasImageInput = input.image_url || input.imageUrl || input.first_frame_image;
    if (!hasImageInput) {
      kieModelName = `${modelBase}-TEXT_2_VIDEO`;
    } else if (input.image_end !== undefined) {
      // If image_end is specified, this is first/last frames mode
      kieModelName = `${modelBase}-FIRST_AND_LAST_FRAMES_2_VIDEO`;
    } else {
      // Otherwise, it's reference mode
      kieModelName = `${modelBase}-REFERENCE_2_VIDEO`;
    }
  } else {
    // SORA 2 models use lowercase with hyphens
    const hasImageInput = input.image_urls || input.image_url || input.imageUrl || input.first_frame_image;
    const modelSuffix = hasImageInput ? 'image-to-video' : 'text-to-video';
    kieModelName = `${modelBase}-${modelSuffix}`;

    // CRITICAL FIX: SORA 2 requires image_urls as an array, not image_url as string
    // Normalize image_url to image_urls array for SORA 2
    if (hasImageInput && !input.image_urls) {
      const imageValue = input.image_url || input.imageUrl;
      if (imageValue) {
        console.log('SORA 2 FIX: Converting image_url to image_urls array');
        input.image_urls = [imageValue];
        // Remove the singular forms
        delete input.image_url;
        delete input.imageUrl;
      }
    }
  }

  try {
    if (logs) {
      console.log(`KIE.ai: Creating task for model ${model} (mapped to ${kieModelName})`);
    }

    // Prepare request body with optional callback URL
    // Callback is optional - we're polling instead of waiting for callbacks
    const requestBody: any = {
      model: kieModelName,
      input,
    };

    // Only include callBackUrl if provided (it's optional)
    if (options.callbackUrl) {
      requestBody.callBackUrl = options.callbackUrl;
    }

    console.log('KIE.ai request body:', JSON.stringify(requestBody, null, 2));
    console.log('KIE.ai endpoint:', `${KIE_API_BASE}${createEndpoint}`);

    // Create the generation task
    const createResponse = await nodeFetch(`${KIE_API_BASE}${createEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      agent: proxyAgent as any
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`KIE.ai task creation failed (${createResponse.status}):`, errorText);
      throw new Error(`Failed to create KIE.ai task: ${errorText}`);
    }

    const createData: KieTaskResponse = await createResponse.json();

    if (createData.code !== 200) {
      throw new Error(`KIE.ai API error: ${createData.msg}`);
    }

    const taskId = createData.data?.taskId;

    if (!taskId) {
      console.error('No taskId in response:', createData);
      throw new Error('No taskId returned from KIE.ai API');
    }

    if (logs) {
      console.log(`KIE.ai: Task created with ID ${taskId}, starting polling...`);
    }

    // Poll until complete
    const result = await pollTaskStatus(taskId, apiKey, statusEndpoint, onQueueUpdate);

    if (logs) {
      console.log(`KIE.ai: Task ${taskId} completed with status ${result.status}`);
    }

    return result;

  } catch (error: any) {
    console.error('KIE.ai subscribe error:', error);
    throw error;
  }
}

/**
 * Helper to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export model identifiers as constants for easy reference
export const KIE_MODELS = {
  // Veo 3 models (Google)
  VEO3_FAST: 'veo3_fast',

  // Sora 2 models (OpenAI)
  SORA2: 'sora2',
  SORA2_PRO: 'sora2_pro',
  SORA2_PRO_HD: 'sora2_pro_hd',

  // Seedance models (ByteDance)
  SEEDANCE_LITE_TEXT2VIDEO: 'bytedance/v1-lite-text-to-video',
  SEEDANCE_LITE_IMAGE2VIDEO: 'bytedance/v1-lite-image-to-video',
  SEEDANCE_PRO_TEXT2VIDEO: 'bytedance/v1-pro-text-to-video',
  SEEDANCE_PRO_IMAGE2VIDEO: 'bytedance/v1-pro-image-to-video',
} as const;

// Model pricing (cost per second in USD - API cost before 50% margin)
export const KIE_MODEL_PRICING = {
  veo3_fast: 0.0375, // $0.30/8s
  sora2: 0.015, // $0.15/10s
  sora2_pro: 0.06, // $0.60/10s API cost → 90 credits ($0.90) after 50% margin
  sora2_pro_hd: 0.13333, // $1.3333/10s API cost → 200 credits ($2.00) after 50% margin
  seedance_lite_480p: 0.010,
  seedance_lite_720p: 0.0225,
  seedance_lite_1080p: 0.050,
  seedance_pro_480p: 0.020,
  seedance_pro_720p: 0.045,
  seedance_pro_1080p: 0.100,
} as const;
