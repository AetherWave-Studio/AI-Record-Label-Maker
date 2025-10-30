// ttapi.io Midjourney API Client
// Provides integration with ttapi.io's Midjourney API

import nodeFetch from "node-fetch";

const TTAPI_BASE_URL = "https://api.ttapi.io/midjourney/v1";
const TTAPI_API_KEY = process.env.TTAPI_IO_API_KEY;

// Poll configuration
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max (60 * 3s = 180s)

export interface TtapiImagineRequest {
  prompt: string;
  model?: "fast" | "turbo" | "relax";
  hookUrl?: string;
  aspectRatio?: string;
}

export interface TtapiTaskResponse {
  status: string;
  message: string;
  data?: {
    jobId: string;
  };
}

export interface TtapiStatusResponse {
  status: string;
  message: string;
  data?: {
    jobId: string;
    status: string;
    prompt?: string;
    imageUrl?: string;
    imageUrls?: string[];
    progress?: number;
    failReason?: string;
  };
}

export interface TtapiResult {
  success: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  error?: string;
  taskId?: string;
}

/**
 * Generate images using ttapi.io Midjourney API
 * @param prompt Text prompt for image generation
 * @param model Speed model: "fast" (default), "turbo", or "relax"
 * @param aspectRatio Aspect ratio (e.g., "1:1", "16:9", "9:16")
 * @param timeoutSeconds Maximum time to wait for completion (default: 180s for fast, 120s for turbo)
 */
export async function generateMidjourneyTtapi(
  prompt: string,
  model: "fast" | "turbo" | "relax" = "fast",
  aspectRatio?: string,
  timeoutSeconds?: number
): Promise<TtapiResult> {
  if (!TTAPI_API_KEY) {
    console.error("❌ TTAPI_IO_API_KEY not configured");
    return {
      success: false,
      error: "ttapi.io API key not configured"
    };
  }

  try {
    console.log(`🎨 Starting ttapi.io Midjourney generation (${model} mode)...`);
    console.log(`Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);

    // Build the full prompt with aspect ratio if specified
    let fullPrompt = prompt;
    if (aspectRatio && aspectRatio !== "1:1") {
      fullPrompt += ` --ar ${aspectRatio}`;
    }

    // Step 1: Submit the imagine request
    const imagineData: TtapiImagineRequest = {
      prompt: fullPrompt,
      model: model,
      hookUrl: "" // We'll poll instead of using webhooks
    };

    console.log(`📤 Submitting to ttapi.io with model: ${model}`);

    const imagineResponse = await nodeFetch(`${TTAPI_BASE_URL}/imagine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TT-API-KEY": TTAPI_API_KEY
      },
      body: JSON.stringify(imagineData)
    });

    if (!imagineResponse.ok) {
      const errorText = await imagineResponse.text();
      console.error(`❌ ttapi.io imagine request failed (${imagineResponse.status}):`, errorText);
      return {
        success: false,
        error: `ttapi.io API error: ${errorText}`
      };
    }

    const imagineResult: TtapiTaskResponse = await imagineResponse.json();
    console.log("ttapi.io imagine response:", imagineResult);

    if (imagineResult.status !== 'SUCCESS' || !imagineResult.data?.jobId) {
      console.error("❌ Invalid response from ttapi.io:", imagineResult);
      return {
        success: false,
        error: imagineResult.message || "Failed to create job"
      };
    }

    const jobId = imagineResult.data.jobId;
    console.log(`✅ Job created: ${jobId}`);

    // Step 2: Poll for completion
    const maxAttempts = timeoutSeconds ? Math.ceil((timeoutSeconds * 1000) / POLL_INTERVAL_MS) : MAX_POLL_ATTEMPTS;
    console.log(`🔄 Polling for completion (max ${maxAttempts} attempts, ${POLL_INTERVAL_MS}ms interval)...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

      const statusResponse = await nodeFetch(`${TTAPI_BASE_URL}/job/${jobId}`, {
        method: "GET",
        headers: {
          "TT-API-KEY": TTAPI_API_KEY
        }
      });

      if (!statusResponse.ok) {
        console.error(`⚠️ Status check failed (${statusResponse.status}), will retry...`);
        continue;
      }

      const statusResult: TtapiStatusResponse = await statusResponse.json();
      const status = statusResult.data?.status?.toLowerCase();
      const progress = statusResult.data?.progress || 0;

      console.log(`[${attempt}/${maxAttempts}] Status: ${status}, Progress: ${progress}%`);

      if (status === "success" || status === "completed") {
        const imageUrl = statusResult.data?.imageUrl;
        const imageUrls = statusResult.data?.imageUrls;

        if (imageUrl || (imageUrls && imageUrls.length > 0)) {
          console.log(`✅ Generation complete! Images: ${imageUrls?.length || 1}`);
          return {
            success: true,
            imageUrl: imageUrl || imageUrls?.[0],
            imageUrls: imageUrls || (imageUrl ? [imageUrl] : []),
            taskId: jobId
          };
        } else {
          console.error("❌ Job completed but no images returned:", statusResult);
          return {
            success: false,
            error: "Job completed but no images were returned"
          };
        }
      }

      if (status === "failed" || status === "error") {
        const failReason = statusResult.data?.failReason || "Unknown error";
        console.error(`❌ Generation failed: ${failReason}`);
        return {
          success: false,
          error: `Generation failed: ${failReason}`
        };
      }

      // Continue polling for pending/processing/queued states
    }

    // Timeout reached
    const timeoutDuration = timeoutSeconds || (maxAttempts * POLL_INTERVAL_MS / 1000);
    console.error(`⏱️ Timeout after ${timeoutDuration}s`);
    return {
      success: false,
      error: `Generation did not complete within ${timeoutDuration} seconds. The ttapi.io servers may be experiencing delays.`,
      taskId: jobId
    };

  } catch (error: any) {
    console.error("❌ ttapi.io Midjourney error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}
