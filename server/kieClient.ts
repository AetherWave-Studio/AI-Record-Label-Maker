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
// Construct proxy URL from individual environment variables or use WEBSHARE_PROXY
let PROXY_URL: string | undefined;

if (process.env.WEBSHARE_PROXY) {
  PROXY_URL = process.env.WEBSHARE_PROXY;
} else if (process.env.PROXY_HOST && process.env.PROXY_PORT && process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
  // Construct from individual components
  const { PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD } = process.env;
  PROXY_URL = `http://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`;
  console.log(`🔧 Using Webshare proxy: ${PROXY_USERNAME}@${PROXY_HOST}:${PROXY_PORT}`);
}

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
  timeoutSeconds?: number; // Optional custom timeout in seconds
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
async function pollVeo3Status(
  taskId: string,
  apiKey: string,
  maxAttempts: number = MAX_POLL_ATTEMPTS,
  onUpdate?: (update: { status: string; progress?: number }) => void
): Promise<KieResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // VEO 3 uses GET with taskId as query parameter
      const statusResponse = await nodeFetch(`${KIE_API_BASE}/veo/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        agent: proxyAgent as any
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`VEO 3 status check failed (${statusResponse.status}):`, errorText);

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
        console.log('VEO 3 API response structure:', JSON.stringify(statusData, null, 2));
      }

      // VEO 3 response structure is different from jobs API
      if (statusData.code !== 200) {
        console.error('VEO 3 returned error code:', statusData);

        // Check for failed status
        const taskStatus = statusData.data?.status || statusData.data?.state;
        if (taskStatus === 'FAILED' || taskStatus === 'failed') {
          return {
            status: 'failed',
            error: statusData.data.error || statusData.msg || 'Task failed'
          };
        }

        // Otherwise continue polling
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Check VEO 3 specific status fields
      // Note: statusData.msg is the API response status (e.g., "success"), NOT the task status
      // Task status comes from data.status, data.state, or successFlag
      const taskStatus = statusData.data?.status || statusData.data?.state || 'processing';
      const progress = statusData.data?.progress;

      // Call update callback if provided
      if (onUpdate) {
        onUpdate({ status: taskStatus, progress });
      }

      console.log(`VEO 3 task ${taskId} status: ${taskStatus}${progress ? ` (${progress}%)` : ''}, successFlag: ${statusData.data?.successFlag}`);

      // VEO 3 completion check - ONLY use successFlag === 1
      // Do NOT check msg field as it's just the API response status
      const isSuccess = statusData.data?.successFlag === 1;
      
      if (isSuccess) {
        // VEO 3 returns video URLs in data.response.resultUrls array
        const resultUrls = statusData.data?.response?.resultUrls;
        const originUrls = statusData.data?.response?.originUrls;
        
        const videoUrl = resultUrls?.[0] || originUrls?.[0];

        if (!videoUrl) {
          console.error('VEO 3 task completed but no video URL found:', JSON.stringify(statusData, null, 2));
          return {
            status: 'failed',
            error: 'Task completed but no video URL found in response',
            data: statusData.data
          };
        }

        console.log('VEO 3 task completed successfully, video URL:', videoUrl);
        
        return {
          status: 'complete',
          videoUrl,
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
      console.error('Error polling VEO 3 task status:', error.message);

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
    error: `Task did not complete within ${(maxAttempts * POLL_INTERVAL_MS) / 1000}s`
  };
}

async function pollTaskStatus(
  taskId: string,
  apiKey: string,
  endpoint: string,
  maxAttempts: number = MAX_POLL_ATTEMPTS,
  onUpdate?: (update: { status: string; progress?: number }) => void
): Promise<KieResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
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
        if (taskState === 'FAILED' || taskState === 'failed' || taskState === 'fail') {
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

      if (taskStatus === 'FAILED' || taskStatus === 'failed' || taskStatus === 'fail') {
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
    error: `Task did not complete within ${(maxAttempts * POLL_INTERVAL_MS) / 1000}s`
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
  const { model, input, apiKey, logs = false, onQueueUpdate, timeoutSeconds } = options;

  if (!apiKey) {
    throw new Error('KIE.ai API key is required');
  }

  // VEO 3 uses a different API endpoint than other KIE.ai models
  const isVeo3 = model.startsWith('veo3');
  const createEndpoint = isVeo3 ? '/veo/generate' : '/jobs/createTask';
  const statusEndpoint = isVeo3 ? '/veo/record-info' : '/jobs/recordInfo';

  // Map our internal model names to KIE.ai's expected format
  // Different models have different naming conventions:
  // - SORA 2: Uses "text-to-video" or "image-to-video"
  // - VEO 3: Uses "veo3_fast" as model name in request body

  const kieModelBaseMap: Record<string, string> = {
    'sora2': 'sora-2',
    'veo3_fast': 'veo-3-fast',
  };

  const modelBase = kieModelBaseMap[model] || model;
  let kieModelName: string;

  // Determine the correct model name and parameters based on model type
  if (isVeo3) {
    // VEO 3 models use their specific names in the request body
    // Map veo3_fast -> veo3_fast, veo3_quality -> veo3_quality (when added)
    kieModelName = model; // Use the exact model name (veo3_fast, future veo3_quality)

    // VEO 3 API uses different parameter names
    // Convert our standard parameters to VEO 3 format
    if (input.image_url || input.imageUrl || input.endImageUrl) {
      // VEO 3 expects imageUrls as array
      const imageUrls = [];
      if (input.image_url || input.imageUrl) {
        imageUrls.push(input.image_url || input.imageUrl);
      }
      if (input.endImageUrl) {
        imageUrls.push(input.endImageUrl);
      }
      input.imageUrls = imageUrls;

      // Remove our internal parameter names
      delete input.image_url;
      delete input.imageUrl;
      delete input.endImageUrl;
    }

    // Map our parameters to VEO 3 API format
    if (input.remove_watermark !== undefined) {
      input.watermark = input.remove_watermark ? 'MyBrand' : null;
      delete input.remove_watermark;
    }

    // Set generation type based on image mode and available images
    if (input.imageUrls && input.imageUrls.length > 0) {
      // Check if we have both first and last frame images for FIRST_AND_LAST_FRAMES_2_VIDEO
      if (input.imageUrls.length === 2) {
        input.generationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
      } else {
        input.generationType = 'REFERENCE_2_VIDEO';
      }
    } else {
      input.generationType = 'TEXT_2_VIDEO';
    }
    delete input.imageMode;

    // Add other VEO 3 specific parameters
    // seed is optional - system will assign automatically if not provided
    input.enableTranslation = true;

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
    const requestBody: any = isVeo3 ? {
      // VEO 3 uses direct parameters, not nested under "input"
      model: kieModelName,
      ...input,
    } : {
      // Other models use nested input structure
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

    // Calculate timeout based on quality and duration
    let maxAttempts = MAX_POLL_ATTEMPTS; // Default 10 minutes

    if (timeoutSeconds) {
      // Use custom timeout if provided
      maxAttempts = Math.ceil(timeoutSeconds / (POLL_INTERVAL_MS / 1000));
    } else if (model.includes('sora2_pro')) {
      // Default timeouts for SORA 2 Pro based on quality
      const quality = input?.size || 'standard';
      const duration = parseInt(input?.n_frames) || 10;

      if (quality === 'high') {
        // HD quality: 10-20 minutes for 10s, up to 30 minutes for 15s
        maxAttempts = duration === 10 ? 400 : 600; // 20-30 minutes
      } else {
        // Standard quality: 5-10 minutes
        maxAttempts = duration === 10 ? 200 : 300; // 10-15 minutes
      }
    }

    // Poll until complete using the appropriate polling function
    const result = isVeo3
      ? await pollVeo3Status(taskId, apiKey, maxAttempts, onQueueUpdate)
      : await pollTaskStatus(taskId, apiKey, statusEndpoint, maxAttempts, onQueueUpdate);

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

  // Seedance models (ByteDance)
  SEEDANCE_LITE_TEXT2VIDEO: 'bytedance/v1-lite-text-to-video',
  SEEDANCE_LITE_IMAGE2VIDEO: 'bytedance/v1-lite-image-to-video',
  SEEDANCE_PRO_TEXT2VIDEO: 'bytedance/v1-pro-text-to-video',
  SEEDANCE_PRO_IMAGE2VIDEO: 'bytedance/v1-pro-image-to-video',
} as const;

// Model pricing (cost per generation in USD - API cost before 50% margin)
export const KIE_MODEL_PRICING = {
  veo3_fast: 0.30, // $0.30 per 8s generation (fixed duration)
  sora2: 0.015, // $0.15/10s
  seedance_lite_480p: 0.010,
  seedance_lite_720p: 0.0225,
  seedance_lite_1080p: 0.050,
  seedance_pro_480p: 0.020,
  seedance_pro_720p: 0.045,
  seedance_pro_1080p: 0.100,
} as const;
