import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Temporary directory for video processing
const TMP_DIR = '/tmp/video-processing';

// Ensure temp directory exists
async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
}

/**
 * Extract a specific frame from a video at a given timestamp
 * @param videoPath Path to the input video
 * @param timestamp Time in seconds (e.g., 2.5 for frame at 2.5 seconds)
 * @returns Base64-encoded PNG image of the frame
 */
export async function extractFrame(videoPath: string, timestamp: number): Promise<string> {
  await ensureTmpDir();
  
  const outputPath = path.join(TMP_DIR, `frame_${Date.now()}_${Math.random().toString(36).substring(7)}.png`);
  
  try {
    // Use ffmpeg to extract frame at specific timestamp
    const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`;
    console.log(`Extracting frame at ${timestamp}s:`, command);
    
    await execAsync(command);
    
    // Read the frame and convert to base64
    const { readFile } = await import('fs/promises');
    const frameBuffer = await readFile(outputPath);
    const base64Frame = frameBuffer.toString('base64');
    
    // Clean up temporary file
    await unlink(outputPath);
    
    return `data:image/png;base64,${base64Frame}`;
  } catch (error: any) {
    console.error('Error extracting frame:', error);
    throw new Error(`Failed to extract frame: ${error.message}`);
  }
}

/**
 * Get video duration in seconds
 * @param videoPath Path to the input video
 * @returns Duration in seconds
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error: any) {
    console.error('Error getting video duration:', error);
    throw new Error(`Failed to get video duration: ${error.message}`);
  }
}

/**
 * Extract first and last frames from the first 50% of a video
 * @param videoPath Path to the input video
 * @returns Object with firstFrame and lastFrame as base64-encoded images
 */
export async function extractLoopFrames(videoPath: string): Promise<{ firstFrame: string; lastFrame: string; duration: number }> {
  const duration = await getVideoDuration(videoPath);
  const halfDuration = duration / 2;
  
  console.log(`Video duration: ${duration}s, extracting frames from first ${halfDuration}s`);
  
  // Extract first frame (at 0.1s to avoid black frame)
  const firstFrame = await extractFrame(videoPath, 0.1);
  
  // Extract last frame of first 50% (slightly before the midpoint to get a good frame)
  const lastFrame = await extractFrame(videoPath, halfDuration - 0.1);
  
  return {
    firstFrame,
    lastFrame,
    duration: halfDuration
  };
}

/**
 * Trim video to first 50%
 * @param inputPath Path to input video
 * @param outputPath Path to output video
 * @returns Duration of the trimmed video
 */
export async function trimToFirstHalf(inputPath: string, outputPath: string): Promise<number> {
  const duration = await getVideoDuration(inputPath);
  const halfDuration = duration / 2;
  
  try {
    const command = `ffmpeg -i "${inputPath}" -t ${halfDuration} -c copy "${outputPath}"`;
    console.log(`Trimming video to first ${halfDuration}s:`, command);
    
    await execAsync(command);
    return halfDuration;
  } catch (error: any) {
    console.error('Error trimming video:', error);
    throw new Error(`Failed to trim video: ${error.message}`);
  }
}

/**
 * Transcode video to H.264 MP4 for consistent concatenation
 * @param inputPath Path to input video (any format)
 * @param outputPath Path to output H.264 MP4
 */
export async function transcodeToH264(inputPath: string, outputPath: string): Promise<void> {
  await ensureTmpDir();
  
  try {
    // Transcode to H.264 MP4 with consistent parameters
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;
    console.log('Transcoding video to H.264 MP4:', command);
    
    await execAsync(command);
  } catch (error: any) {
    console.error('Error transcoding video:', error);
    throw new Error(`Failed to transcode video: ${error.message}`);
  }
}

/**
 * Concatenate two videos
 * @param video1Path Path to first video
 * @param video2Path Path to second video
 * @param outputPath Path to output concatenated video
 */
export async function concatenateVideos(video1Path: string, video2Path: string, outputPath: string): Promise<void> {
  await ensureTmpDir();
  
  // Create a file list for ffmpeg concat
  const listPath = path.join(TMP_DIR, `concat_${Date.now()}.txt`);
  const listContent = `file '${video1Path}'\nfile '${video2Path}'`;
  
  try {
    await writeFile(listPath, listContent);
    
    // Use concat demuxer for fast concatenation
    const command = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    console.log('Concatenating videos:', command);
    
    await execAsync(command);
    
    // Clean up list file
    await unlink(listPath);
  } catch (error: any) {
    console.error('Error concatenating videos:', error);
    throw new Error(`Failed to concatenate videos: ${error.message}`);
  }
}

/**
 * Download a video from URL to temporary file
 * @param videoUrl URL of the video
 * @returns Path to downloaded video file
 */
export async function downloadVideo(videoUrl: string): Promise<string> {
  await ensureTmpDir();
  
  const outputPath = path.join(TMP_DIR, `downloaded_${Date.now()}.mp4`);
  
  try {
    // Use curl or wget to download (ffmpeg can also do this)
    const command = `curl -L "${videoUrl}" -o "${outputPath}"`;
    console.log('Downloading video:', command);
    
    await execAsync(command);
    return outputPath;
  } catch (error: any) {
    console.error('Error downloading video:', error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Clean up temporary file
 * @param filePath Path to file to delete
 */
export async function cleanupFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    }
  } catch (error: any) {
    console.error('Error cleaning up file:', error);
    // Don't throw - cleanup failures shouldn't break the main flow
  }
}
