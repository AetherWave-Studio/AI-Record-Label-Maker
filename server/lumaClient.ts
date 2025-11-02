// Luma Dream Machine Ray 2 Flash API Client
// Provides clean interface for Luma video generation via fal.ai
// Supports Text-to-Video, Image-to-Video, and Video-to-Video (Modify) with native loop mode

import { fal } from "@fal-ai/client";

// Luma Ray 2 Flash API endpoints
export const LUMA_MODELS = {
  TEXT_TO_VIDEO: "fal-ai/luma-dream-machine/ray-2-flash",
  IMAGE_TO_VIDEO: "fal-ai/luma-dream-machine/ray-2-flash/image-to-video",
  VIDEO_TO_VIDEO_MODIFY: "fal-ai/luma-dream-machine/ray-2-flash/modify",
} as const;

// Luma Ray 2 Flash pricing (fal.ai)
export const LUMA_PRICING = {
  TEXT_TO_VIDEO: 0.04,       // $0.04 per second
  IMAGE_TO_VIDEO: 0.04,      // $0.04 per second
  VIDEO_TO_VIDEO: 0.12,      // $0.12 per second (modify endpoint)
} as const;

export interface LumaTextToVideoOptions {
  prompt: string;
  duration?: "5s" | "9s";     // Default "5s"
  aspect_ratio?: "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "9:21";
  loop?: boolean;             // Enable seamless loop mode
}

export interface LumaImageToVideoOptions {
  prompt: string;
  image_url: string;
  duration?: "5s" | "9s";     // Default "5s"
  aspect_ratio?: "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "9:21";
  loop?: boolean;
}

export interface LumaVideoToVideoOptions {
  prompt: string;
  video_url: string;
  image_url?: string;         // Optional reference image
  loop?: boolean;
}

export interface LumaResult {
  status: "complete" | "failed";
  videoUrl?: string;
  error?: string;
  data?: any;
}

/**
 * Generate a seamless loop video from text prompt using Luma Ray 2 Flash
 * The "loop" keyword in the prompt tells Luma to create a seamless loop
 * @param options Text prompt, duration, aspect ratio, and loop setting
 * @returns Video URL when complete
 */
export async function lumaTextToLoop(
  options: LumaTextToVideoOptions
): Promise<LumaResult> {
  try {
    console.log('🎬 Luma Text-to-Loop generation starting...');
    
    // Append "loop" to prompt if loop mode is enabled
    const promptWithLoop = options.loop 
      ? `${options.prompt}, seamless loop, continuous motion`
      : options.prompt;
    
    const result = await fal.subscribe(LUMA_MODELS.TEXT_TO_VIDEO, {
      input: {
        prompt: promptWithLoop,
        duration: options.duration || "5s",
        aspect_ratio: options.aspect_ratio || "16:9",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`Luma generation progress: ${JSON.stringify(update)}`);
        }
      },
    });

    console.log('Luma API response:', JSON.stringify(result, null, 2));

    // Extract video URL from fal.ai response
    const videoUrl = result.data?.video?.url;

    if (!videoUrl) {
      console.error('No video URL in Luma response:', result);
      return {
        status: "failed",
        error: "No video URL returned from Luma API",
        data: result.data,
      };
    }

    console.log('✅ Luma Text-to-Loop completed successfully:', videoUrl);

    return {
      status: "complete",
      videoUrl,
      data: result.data,
    };

  } catch (error: any) {
    console.error('Luma Text-to-Loop error:', error);
    return {
      status: "failed",
      error: error.message || "Luma generation failed",
    };
  }
}

/**
 * Generate a seamless loop video from an image using Luma Ray 2 Flash
 * The AI animates the image with smooth, continuous motion that loops perfectly
 * @param options Image URL, motion prompt, duration, aspect ratio
 * @returns Video URL when complete
 */
export async function lumaImageToLoop(
  options: LumaImageToVideoOptions
): Promise<LumaResult> {
  try {
    console.log('🎬 Luma Image-to-Loop generation starting...');
    
    // Append "loop" to prompt for seamless looping
    const promptWithLoop = options.loop
      ? `${options.prompt}, seamless loop, continuous motion, smooth return to starting position`
      : options.prompt;
    
    const result = await fal.subscribe(LUMA_MODELS.IMAGE_TO_VIDEO, {
      input: {
        prompt: promptWithLoop,
        image_url: options.image_url,
        duration: options.duration || "5s",
        aspect_ratio: options.aspect_ratio || "16:9",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`Luma I2V progress: ${JSON.stringify(update)}`);
        }
      },
    });

    console.log('Luma I2V API response:', JSON.stringify(result, null, 2));

    const videoUrl = result.data?.video?.url;

    if (!videoUrl) {
      console.error('No video URL in Luma I2V response:', result);
      return {
        status: "failed",
        error: "No video URL returned from Luma API",
        data: result.data,
      };
    }

    console.log('✅ Luma Image-to-Loop completed successfully:', videoUrl);

    return {
      status: "complete",
      videoUrl,
      data: result.data,
    };

  } catch (error: any) {
    console.error('Luma Image-to-Loop error:', error);
    return {
      status: "failed",
      error: error.message || "Luma I2V generation failed",
    };
  }
}

/**
 * Convert an uploaded video to a seamless loop using Luma Ray 2 Flash Modify
 * This is the most expensive mode ($0.12/sec vs $0.04/sec)
 * @param options Video URL, transformation prompt, optional reference image
 * @returns Looped video URL when complete
 */
export async function lumaVideoToLoop(
  options: LumaVideoToVideoOptions
): Promise<LumaResult> {
  try {
    console.log('🎬 Luma Video-to-Loop (Modify) generation starting...');
    
    // Append "loop" to prompt
    const promptWithLoop = options.loop
      ? `${options.prompt}, seamless loop, smooth continuous motion, perfect loop transition`
      : options.prompt;
    
    const input: any = {
      prompt: promptWithLoop,
      video_url: options.video_url,
    };
    
    // Add reference image if provided
    if (options.image_url) {
      input.image_url = options.image_url;
    }
    
    const result = await fal.subscribe(LUMA_MODELS.VIDEO_TO_VIDEO_MODIFY, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`Luma V2V progress: ${JSON.stringify(update)}`);
        }
      },
    });

    console.log('Luma V2V API response:', JSON.stringify(result, null, 2));

    const videoUrl = result.data?.video?.url;

    if (!videoUrl) {
      console.error('No video URL in Luma V2V response:', result);
      return {
        status: "failed",
        error: "No video URL returned from Luma Modify API",
        data: result.data,
      };
    }

    console.log('✅ Luma Video-to-Loop completed successfully:', videoUrl);

    return {
      status: "complete",
      videoUrl,
      data: result.data,
    };

  } catch (error: any) {
    console.error('Luma Video-to-Loop error:', error);
    return {
      status: "failed",
      error: error.message || "Luma V2V generation failed",
    };
  }
}
