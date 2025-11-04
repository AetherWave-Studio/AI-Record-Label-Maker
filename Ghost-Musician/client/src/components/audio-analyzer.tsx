import { useEffect, useState } from "react";
import { AudioWaveform } from "lucide-react";
import WaveformVisualizer from "./waveform-visualizer";

interface AudioAnalyzerProps {
  file: File;
  isAnalyzing: boolean;
}

export default function AudioAnalyzer({ file, isAnalyzing }: AudioAnalyzerProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    };

    if (file) {
      initAudio();
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [file]);

  return (
    <div className="bg-deep-slate/80 rounded-lg p-6 border border-sky-glint/30">
      <h5 className="font-medium mb-4 flex items-center">
        <AudioWaveform className="text-sky-glint mr-2" size={20} />
        Audio Analysis
      </h5>
      <WaveformVisualizer 
        audioBuffer={audioBuffer}
        isAnalyzing={isAnalyzing}
      />
      {audioBuffer && (
        <div className="mt-4 text-sm text-soft-gray">
          <p>Duration: {Math.round(audioBuffer.duration)}s</p>
          <p>Sample Rate: {audioBuffer.sampleRate}Hz</p>
          <p>Channels: {audioBuffer.numberOfChannels}</p>
        </div>
      )}
    </div>
  );
}
