import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  isAnalyzing: boolean;
}

export default function WaveformVisualizer({ audioBuffer, isAnalyzing }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaveform = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      if (audioBuffer) {
        // Draw actual waveform
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        
        ctx.strokeStyle = '#A6EFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          
          for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          
          const y1 = (1 + min) * amp;
          const y2 = (1 + max) * amp;
          
          if (i === 0) {
            ctx.moveTo(i, y1);
          } else {
            ctx.lineTo(i, y1);
            ctx.lineTo(i, y2);
          }
        }
        
        ctx.stroke();
      } else {
        // Draw animated bars when analyzing
        const barCount = 20;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.random() * height * 0.8 + height * 0.1;
          const hue = (180 + (i * 10)) % 360;
          
          ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        }
      }
    };

    drawWaveform();
    
    let animationFrame: number;
    if (isAnalyzing && !audioBuffer) {
      const animate = () => {
        drawWaveform();
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [audioBuffer, isAnalyzing]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className="w-full h-24 bg-deep-slate/50 rounded border border-sky-glint/20"
      data-testid="waveform-canvas"
    />
  );
}
