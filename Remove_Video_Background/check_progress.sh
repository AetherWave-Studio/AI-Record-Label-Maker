#!/bin/bash
echo "Monitoring video background removal progress..."
echo "This may take 3-5 minutes to complete (121 frames to process)"
echo ""

while true; do
    if [ -f "/home/ubuntu/aetherwave_transparent_loop.webm" ]; then
        echo "✓ Processing complete!"
        tail -10 /home/ubuntu/video_processing.log | grep -E "(✓|SUCCESS|saved)"
        ls -lh /home/ubuntu/aetherwave_transparent_loop.webm
        exit 0
    fi
    
    # Get last progress line
    progress=$(tail -5 /home/ubuntu/video_processing.log 2>/dev/null | grep -o '[0-9]\+%' | tail -1)
    if [ ! -z "$progress" ]; then
        echo "[$(date +%T)] Progress: $progress"
    fi
    
    sleep 15
done
