#!/usr/bin/env python3
"""
Video Background Removal Script with Real-Time Progress Streaming
Outputs JSON progress to stdout for real-time UI updates
"""

import cv2
import numpy as np
from PIL import Image
from rembg import remove
from pathlib import Path
import subprocess
import json
import sys
import tempfile
import os

def emit_progress(step, message, progress=None, total=None):
    """Emit JSON progress update to stdout"""
    data = {
        'step': step,
        'message': message,
        'progress': progress,
        'total': total,
        'percent': round((progress / total * 100), 1) if progress and total else None
    }
    print(json.dumps(data), flush=True)

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

def process_video_with_transparency(input_path, output_webm, output_mov=None, output_gif=None):
    """Process video and create outputs with transparency"""

    # STEP 1: Reading metadata
    emit_progress('step1', 'Reading video metadata...', 0, 1)
    info = get_video_info(input_path)
    emit_progress('step1', f"Video: {info['width']}x{info['height']}, {info['fps']} fps", 1, 1)

    # STEP 2: Extract frames
    cap = cv2.VideoCapture(input_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    emit_progress('step2', f'Extracting {frame_count} frames...', 0, frame_count)

    # Use system temp directory for cross-platform compatibility
    temp_dir = Path(tempfile.gettempdir()) / 'transparent_frames'
    temp_dir.mkdir(exist_ok=True)

    frames_data = []
    for i in range(frame_count):
        ret, frame = cap.read()
        if not ret:
            break

        # Convert BGR to RGB and store
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames_data.append(frame_rgb)

        # Emit progress every 10 frames or at end
        if i % 10 == 0 or i == frame_count - 1:
            emit_progress('step2', f'Extracting frame {i+1}/{frame_count}...', i+1, frame_count)

    cap.release()

    # STEP 3: AI Background Removal
    emit_progress('step3', f'Removing background from {frame_count} frames with AI...', 0, frame_count)

    for i, frame_rgb in enumerate(frames_data):
        pil_image = Image.fromarray(frame_rgb)

        # Remove background - returns RGBA
        output = remove(pil_image)

        # Save as PNG with alpha
        frame_path = temp_dir / f"frame_{i:05d}.png"
        output.save(str(frame_path), 'PNG')

        # Emit progress every 5 frames or at end (AI is slow, update frequently)
        if i % 5 == 0 or i == frame_count - 1:
            emit_progress('step3', f'AI processing frame {i+1}/{frame_count}...', i+1, frame_count)

    # STEP 4: Encoding
    total_encodes = sum([1 for x in [output_webm, output_mov, output_gif] if x])
    current_encode = 0

    # Create WebM
    if output_webm:
        current_encode += 1
        emit_progress('step4', f'Encoding WebM ({current_encode}/{total_encodes})...', current_encode, total_encodes)
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
        subprocess.run(webm_cmd, capture_output=True, text=True)

    # Create MOV
    if output_mov:
        current_encode += 1
        emit_progress('step4', f'Encoding MOV ({current_encode}/{total_encodes})...', current_encode, total_encodes)
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
        subprocess.run(mov_cmd, capture_output=True, text=True)

    # Create GIF
    if output_gif:
        current_encode += 1
        emit_progress('step4', f'Encoding GIF ({current_encode}/{total_encodes})...', current_encode, total_encodes)
        gif_fps = min(info['fps'], 15)
        gif_cmd = [
            'ffmpeg', '-y',
            '-framerate', str(info['fps']),
            '-i', str(temp_dir / 'frame_%05d.png'),
            '-vf', f'fps={gif_fps},scale=iw:ih:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
            '-gifflags', '+transdiff',
            output_gif
        ]
        result = subprocess.run(gif_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            # Fallback: simpler GIF
            simple_gif_cmd = [
                'ffmpeg', '-y',
                '-framerate', str(info['fps']),
                '-i', str(temp_dir / 'frame_%05d.png'),
                '-vf', f'fps={gif_fps}',
                output_gif
            ]
            subprocess.run(simple_gif_cmd, capture_output=True, text=True)

    # STEP 5: Cleanup
    emit_progress('step5', 'Cleaning up temporary files...', 0, 1)
    try:
        for frame_file in temp_dir.glob('*.png'):
            try:
                frame_file.unlink()
            except:
                pass  # Ignore file deletion errors

        # Try to remove directory, but don't fail if it's not empty
        try:
            temp_dir.rmdir()
        except:
            pass  # Ignore directory removal errors
    except Exception as e:
        print(f"Warning: Cleanup incomplete: {e}", flush=True)

    emit_progress('step5', 'Cleanup complete', 1, 1)

    # STEP 6: Complete!
    emit_progress('step6', 'Processing complete! Your video is ready.', 1, 1)

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({'error': 'Invalid arguments'}), flush=True)
        sys.exit(1)

    input_video = sys.argv[1]
    output_path = sys.argv[2]
    format_type = sys.argv[3].lower()

    if format_type == 'webm':
        process_video_with_transparency(input_video, output_path, None, None)
    elif format_type == 'mov':
        process_video_with_transparency(input_video, None, output_path, None)
    elif format_type == 'gif':
        process_video_with_transparency(input_video, None, None, output_path)
    else:
        print(json.dumps({'error': f'Invalid format: {format_type}'}), flush=True)
        sys.exit(1)
