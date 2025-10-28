// KIE.ai API Client Wrapper
// Provides a fal.ai-style subscribe() interface for KIE.ai models
// Handles internal polling so clients get a clean async/await experience

import nodeFetch from "node-fetch";

// KIE.ai API configuration
const KIE_API_BASE = "https://api.kie.ai/api/v1";
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max (200 * 3s = 600s)

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
  msg: string;
  data: {
    taskId: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
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
      const statusResponse = await nodeFetch(`${KIE_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ taskId })
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

      const statusData: KieStatusResponse = await statusResponse.json();

      if (statusData.code !== 200) {
        console.error('KIE.ai returned error code:', statusData);

        // If status is FAILED, stop polling
        if (statusData.data?.status === 'FAILED') {
          return {
            status: 'failed',
            error: statusData.data.error || statusData.msg || 'Task failed'
          };
        }

        // Otherwise continue polling
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const taskStatus = statusData.data.status;
      const progress = statusData.data.progress;

      // Call update callback if provided
      if (onUpdate) {
        onUpdate({ status: taskStatus, progress });
      }

      console.log(`KIE.ai task ${taskId} status: ${taskStatus}${progress ? ` (${progress}%)` : ''}`);

      // Check if task is complete
      if (taskStatus === 'SUCCESS') {
        // Extract video/image URL from response
        const videoUrl = statusData.data.videoUrl ||
                        statusData.data.video_url ||
                        statusData.data.result?.videoUrl ||
                        statusData.data.result?.video_url;

        const imageUrl = statusData.data.imageUrl ||
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

      if (taskStatus === 'FAILED') {
        return {
          status: 'failed',
          error: statusData.data.error || 'Task failed without error message'
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

  // Determine which endpoint to use based on model
  let createEndpoint: string;
  let statusEndpoint: string;

  if (model.startsWith('veo3') || model.includes('veo')) {
    // Veo 3 models use /veo endpoints
    createEndpoint = '/veo/generate';
    statusEndpoint = '/veo/query';
  } else if (model.startsWith('sora2') || model.includes('sora')) {
    // Sora 2 models use /sora endpoints
    createEndpoint = '/sora/generate';
    statusEndpoint = '/sora/query';
  } else if (model.includes('seedance')) {
    // Seedance models use /jobs endpoints
    createEndpoint = '/jobs/createTask';
    statusEndpoint = '/jobs/query';
  } else {
    // Default to jobs endpoint for other models
    createEndpoint = '/jobs/createTask';
    statusEndpoint = '/jobs/query';
  }

  try {
    if (logs) {
      console.log(`KIE.ai: Creating task for model ${model}`);
    }

    // Create the generation task
    const createResponse = await nodeFetch(`${KIE_API_BASE}${createEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input,
        // Optionally add callBackUrl here if you want webhook support
      })
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

// Model pricing (cost per second in USD)
export const KIE_MODEL_PRICING = {
  veo3_fast: 0.0375, // $0.30/8s
  sora2: 0.015, // $0.15/10s
  sora2_pro: 0.045, // $0.45/10s
  sora2_pro_hd: 0.10, // $1/10s
  seedance_lite_480p: 0.010,
  seedance_lite_720p: 0.0225,
  seedance_lite_1080p: 0.050,
  seedance_pro_480p: 0.020,
  seedance_pro_720p: 0.045,
  seedance_pro_1080p: 0.100,
} as const;
