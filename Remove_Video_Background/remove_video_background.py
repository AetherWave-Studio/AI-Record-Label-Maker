#!/usr/bin/env python3
"""
Video Background Removal Script
Removes background from video and replaces with transparency
"""

import cv2
import numpy as np
from PIL import Image
from rembg import remove
from pathlib import Path
import subprocess
import json
from tqdm import tqdm
import os

def get_video_info(video_path):
    """Get video metadata using ffprobe"""
    cmd = [
        'ffprobe', '-v', 'quiet', '-print_format', 'json',
        '-show_streams', '-show_format', video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    info = json.loads(result.stdout)
    
    video_stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
    
    fps_parts = video_stream['r_frame_rate'].split('/')
    fps = float(fps_parts[0]) / float(fps_parts[1])
    
    return {
        'width': int(video_stream['width']),
        'height': int(video_stream['height']),
        'fps': fps,
        'duration': float(info['format']['duration']),
        'total_frames': int(video_stream['nb_frames']) if 'nb_frames' in video_stream else None
    }

def extract_frames(video_path, output_dir):
    """Extract all frames from video"""
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    cap = cv2.VideoCapture(str(video_path))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    frames = []
    print(f"Extracting {frame_count} frames...")
    
    for i in tqdm(range(frame_count)):
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame_rgb)
    
    cap.release()
    return frames

def remove_background_from_frames(frames):
    """Remove background from all frames"""
    print(f"Removing background from {len(frames)} frames...")
    processed_frames = []
    
    for i, frame in enumerate(tqdm(frames)):
        # Convert numpy array to PIL Image
        pil_image = Image.fromarray(frame)
        
        # Remove background - this returns RGBA image
        output = remove(pil_image)
        
        # Convert back to numpy array
        processed_frame = np.array(output)
        processed_frames.append(processed_frame)
    
    return processed_frames

def create_transparent_video(frames, output_path, fps, width, height):
    """Create video with transparency using ffmpeg"""
    temp_dir = Path('/tmp/video_frames')
    temp_dir.mkdir(exist_ok=True)
    
    print(f"Saving {len(frames)} frames as PNG...")
    # Save all frames as PNG with alpha channel
    for i, frame in enumerate(tqdm(frames)):
        frame_path = temp_dir / f"frame_{i:05d}.png"
        pil_image = Image.fromarray(frame, 'RGBA')
        pil_image.save(str(frame_path), 'PNG')
    
    print(f"Encoding video with transparency...")
    # Use ffmpeg to create WebM with VP9 and alpha channel
    cmd = [
        'ffmpeg', '-y',
        '-framerate', str(fps),
        '-i', str(temp_dir / 'frame_%05d.png'),
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuva420p',  # YUV with alpha
        '-auto-alt-ref', '0',     # Required for VP9 alpha
        '-metadata:s:v:0', 'alpha_mode="1"',
        '-b:v', '2M',             # Bitrate
        str(output_path)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}")
        raise Exception("Failed to encode video")
    
    # Clean up temporary frames
    print("Cleaning up temporary files...")
    for frame_file in temp_dir.glob('*.png'):
        frame_file.unlink()
    temp_dir.rmdir()
    
    print(f"✓ Video saved to: {output_path}")

def main():
    input_video = '/home/ubuntu/Uploads/openart-video_6c9b307e_1760945378949.mp4'
    output_video = '/home/ubuntu/aetherwave_transparent_loop.webm'
    
    print("=" * 60)
    print("Video Background Removal Tool")
    print("=" * 60)
    print(f"Input: {input_video}")
    print(f"Output: {output_video}")
    print()
    
    # Get video info
    print("Reading video metadata...")
    info = get_video_info(input_video)
    print(f"Video info:")
    print(f"  - Dimensions: {info['width']}x{info['height']}")
    print(f"  - FPS: {info['fps']}")
    print(f"  - Duration: {info['duration']:.2f}s")
    print()
    
    # Extract frames
    frames = extract_frames(input_video, '/tmp/original_frames')
    print(f"✓ Extracted {len(frames)} frames")
    print()
    
    # Remove backgrounds
    processed_frames = remove_background_from_frames(frames)
    print(f"✓ Background removed from {len(processed_frames)} frames")
    print()
    
    # Create output video
    create_transparent_video(
        processed_frames, 
        output_video, 
        info['fps'],
        info['width'],
        info['height']
    )
    
    print()
    print("=" * 60)
    print("✓ SUCCESS!")
    print("=" * 60)
    print(f"Transparent video saved to: {output_video}")
    print(f"Format: WebM with VP9 codec and alpha channel")
    print(f"The video maintains the original loop nature")
    print()

if __name__ == '__main__':
    main()
