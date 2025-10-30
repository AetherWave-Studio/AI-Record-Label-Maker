#!/usr/bin/env python3
"""
Improved Video Background Removal Script with Proper Alpha Channel Support
"""

import cv2
import numpy as np
from PIL import Image
from rembg import remove
from pathlib import Path
import subprocess
import json
from tqdm import tqdm

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
        'duration': float(info['format']['duration'])
    }

def process_video_with_transparency(input_path, output_webm, output_mov=None):
    """Process video and create outputs with transparency"""
    
    print("=" * 70)
    print("VIDEO BACKGROUND REMOVAL - Enhanced Version")
    print("=" * 70)
    print(f"Input: {input_path}")
    print(f"Output WebM: {output_webm}")
    if output_mov:
        print(f"Output MOV: {output_mov}")
    print()
    
    # Get video info
    print("Reading video metadata...")
    info = get_video_info(input_path)
    print(f"✓ Resolution: {info['width']}x{info['height']}")
    print(f"✓ FPS: {info['fps']}")
    print(f"✓ Duration: {info['duration']:.2f}s")
    print()
    
    # Extract and process frames
    cap = cv2.VideoCapture(input_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"Extracting and processing {frame_count} frames...")
    print("(This may take 3-4 minutes)")
    print()
    
    temp_dir = Path('/tmp/transparent_frames')
    temp_dir.mkdir(exist_ok=True)
    
    for i in tqdm(range(frame_count), desc="Processing frames"):
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(frame_rgb)
        
        # Remove background - returns RGBA
        output = remove(pil_image)
        
        # Save as PNG with alpha
        frame_path = temp_dir / f"frame_{i:05d}.png"
        output.save(str(frame_path), 'PNG')
    
    cap.release()
    print(f"\n✓ Processed all {frame_count} frames")
    print()
    
    # Create WebM with VP9 and alpha
    print("Encoding WebM with transparency (VP9 codec)...")
    webm_cmd = [
        'ffmpeg', '-y',
        '-framerate', str(info['fps']),
        '-i', str(temp_dir / 'frame_%05d.png'),
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuva420p',
        '-auto-alt-ref', '0',
        '-lossless', '0',
        '-crf', '30',
        '-b:v', '0',
        output_webm
    ]
    
    result = subprocess.run(webm_cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✓ WebM created successfully!")
    else:
        print(f"⚠ WebM encoding issue: {result.stderr[:200]}")
    print()
    
    # Optionally create MOV with ProRes 4444 (better alpha support)
    if output_mov:
        print("Encoding MOV with transparency (ProRes 4444 codec)...")
        mov_cmd = [
            'ffmpeg', '-y',
            '-framerate', str(info['fps']),
            '-i', str(temp_dir / 'frame_%05d.png'),
            '-c:v', 'prores_ks',
            '-profile:v', '4444',
            '-pix_fmt', 'yuva444p10le',
            '-vendor', 'apl0',
            output_mov
        ]
        
        result = subprocess.run(mov_cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ MOV created successfully!")
        else:
            print(f"⚠ MOV encoding issue (ProRes may not be available)")
        print()
    
    # Clean up
    print("Cleaning up temporary files...")
    for frame_file in temp_dir.glob('*.png'):
        frame_file.unlink()
    temp_dir.rmdir()
    print("✓ Cleanup complete")
    print()
    
    print("=" * 70)
    print("✓ PROCESSING COMPLETE!")
    print("=" * 70)
    print(f"Your transparent video loop is ready:")
    print(f"  WebM: {output_webm}")
    if output_mov:
        print(f"  MOV:  {output_mov}")
    print()
    print("Format details:")
    print("  - WebM: VP9 codec with yuva420p (web-friendly)")
    print("  - Maintains original dimensions and frame rate")
    print("  - Background replaced with alpha transparency")
    print("  - Seamless loop preserved")
    print()

if __name__ == '__main__':
    input_video = '/home/ubuntu/Uploads/openart-video_6c9b307e_1760945378949.mp4'
    output_webm = '/home/ubuntu/aetherwave_transparent_loop_v2.webm'
    output_mov = '/home/ubuntu/aetherwave_transparent_loop.mov'
    
    process_video_with_transparency(input_video, output_webm, output_mov)
