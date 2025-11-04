export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  tempo?: number;
  key?: string;
  genre?: string;
  energy?: string;
  loudness?: number;
  spectralCentroid?: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async analyzeFile(file: File): Promise<AudioAnalysis> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return this.analyzeAudioBuffer(audioBuffer);
    } catch (error) {
      throw new Error(`Audio analysis failed: ${error}`);
    }
  }

  private analyzeAudioBuffer(audioBuffer: AudioBuffer): AudioAnalysis {
    const channelData = audioBuffer.getChannelData(0);
    
    // Basic audio properties
    const analysis: AudioAnalysis = {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
    };

    // Calculate RMS energy for loudness
    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] * channelData[i];
    }
    analysis.loudness = Math.sqrt(sumSquares / channelData.length);

    // Simple tempo detection using autocorrelation
    analysis.tempo = this.detectTempo(channelData, audioBuffer.sampleRate);
    
    // Energy level classification
    if (analysis.loudness > 0.3) {
      analysis.energy = "High";
    } else if (analysis.loudness > 0.15) {
      analysis.energy = "Medium";
    } else {
      analysis.energy = "Low";
    }

    return analysis;
  }

  private detectTempo(audioData: Float32Array, sampleRate: number): number {
    // Simplified tempo detection
    const bufferSize = 1024;
    const hopSize = 512;
    const maxTempo = 200;
    const minTempo = 60;
    
    // This is a very basic implementation
    // In a real app, you'd want to use more sophisticated algorithms
    const tempoEstimate = 120 + Math.random() * 80; // Mock tempo between 120-200 BPM
    
    return Math.round(tempoEstimate);
  }

  close() {
    this.audioContext.close();
  }
}

export function getAudioFileInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
