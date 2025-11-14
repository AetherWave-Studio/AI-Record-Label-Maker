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

# FFmpeg paths - use full path if available, otherwise system PATH
FFMPEG_PATH = 'C:\\ffmpeg\\bin\\ffmpeg.exe' if os.path.exists('C:\\ffmpeg\\bin\\ffmpeg.exe') else 'ffmpeg'
FFPROBE_PATH = 'C:\\ffmpeg\\bin\\ffprobe.exe' if os.path.exists('C:\\ffmpeg\\bin\\ffprobe.exe') else 'ffprobe'

def get_video_info(video_path):
    """Get video metadata using ffprobe"""
    cmd = [
        FFPROBE_PATH, '-v', 'quiet', '-print_format', 'json',
        '-show_streams', '-show_format', video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"FFprobe error: {result.stderr}")
        raise Exception(f"Failed to read video file: {video_path}")

    info = json.loads(result.stdout)

    if 'streams' not in info:
        raise Exception(f"No video streams found in: {video_path}")

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

def create_transparent_video(frames, output_path_base, fps, width, height):
    """Create video with transparency in multiple formats using ffmpeg"""
    temp_dir = Path('temp_video_frames')
    temp_dir.mkdir(exist_ok=True)

    print(f"Saving {len(frames)} frames as PNG...")
    # Save all frames as PNG with alpha channel
    for i, frame in enumerate(tqdm(frames)):
        frame_path = temp_dir / f"frame_{i:05d}.png"
        pil_image = Image.fromarray(frame, 'RGBA')
        pil_image.save(str(frame_path), 'PNG')

    # Generate MOV with transparency using Apple ProRes 4444 (compressed with alpha)
    print(f"Encoding MOV with transparency (compressed)...")
    mov_path = str(output_path_base).replace('.mov', '.mov')
    cmd_mov = [
        FFMPEG_PATH, '-y',
        '-framerate', str(fps),
        '-i', str(temp_dir / 'frame_%05d.png'),
        '-c:v', 'prores_ks',     # Apple ProRes 4444 - supports alpha channel with good compression
        '-pix_fmt', 'yuva444p10le',  # 10-bit YUVA with alpha
        '-profile:v', '4',       # ProRes 4444 profile (highest quality with alpha)
        '-vendor', 'ap10',       # Apple vendor ID
        mov_path
    ]
    result = subprocess.run(cmd_mov, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"MOV encoding error: {result.stderr}")
    else:
        print(f"[OK] MOV saved to: {mov_path}")

  
    # Generate GIF with transparency
    print(f"Encoding GIF with transparency...")
    gif_path = str(output_path_base).replace('.mov', '.gif')
    cmd_gif = [
        FFMPEG_PATH, '-y',
        '-framerate', str(fps),
        '-i', str(temp_dir / 'frame_%05d.png'),
        '-vf', f'fps={fps},scale={width}:{height}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:reserve_transparent=1[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
        gif_path
    ]
    result = subprocess.run(cmd_gif, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"GIF encoding error: {result.stderr}")
    else:
        print(f"[OK] GIF saved to: {gif_path}")

    # Clean up temporary frames
    print("Cleaning up temporary files...")
    for frame_file in temp_dir.glob('*.png'):
        frame_file.unlink()
    temp_dir.rmdir()

    print(f"[OK] All formats generated!")

def find_video_file():
    """Find the first video file in the Uploads directory"""
    uploads_dir = Path('Uploads')
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm']

    if not uploads_dir.exists():
        raise Exception("Uploads directory not found")

    for ext in video_extensions:
        for video_file in uploads_dir.glob(f'*{ext}'):
            return str(video_file)

    raise Exception(f"No video files found in Uploads directory")

def main():
    # Dynamically find video file in Uploads folder
    input_video = find_video_file()
    input_path = Path(input_video)
    output_video = f'Uploads/{input_path.stem}_transparent.mov'
    
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
    frames = extract_frames(input_video, 'temp_original_frames')
    print(f"[OK] Extracted {len(frames)} frames")
    print()

    # Remove backgrounds
    processed_frames = remove_background_from_frames(frames)
    print(f"[OK] Background removed from {len(processed_frames)} frames")
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
    print("[SUCCESS]")
    print("=" * 60)
    print(f"Generated formats:")
    print(f"  - MOV:  {output_video} (compressed with ProRes 4444)")
    print(f"  - GIF:  {output_video.replace('.mov', '.gif')}")
    print(f"Both formats support transparency and maintain the original loop")
    print()

if __name__ == '__main__':
    main()
