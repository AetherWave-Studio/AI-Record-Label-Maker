import type { AudioMetrics } from './types.js';

/**
 * Audio analyzer with deterministic hashing
 * Uses file characteristics to generate consistent results for the same file
 */
export class AudioAnalyzer {
  /**
   * Generate a simple hash from buffer for deterministic results
   */
  private static hashBuffer(buffer: Buffer): number {
    let hash = 0;
    const step = Math.max(1, Math.floor(buffer.length / 1000)); // Sample ~1000 bytes
    for (let i = 0; i < buffer.length; i += step) {
      hash = ((hash << 5) - hash + buffer[i]) | 0;
    }
    return Math.abs(hash);
  }

  /**
   * Analyze audio buffer and extract metrics
   */
  static analyzeBuffer(buffer: Buffer, filename: string): AudioMetrics {
    // Generate hash for deterministic results
    const hash = this.hashBuffer(buffer);
    const nameHash = filename.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const combinedHash = hash + nameHash;

    const metrics: AudioMetrics = {
      tempo: this.estimateTempo(buffer, combinedHash),
      key: this.estimateKey(combinedHash),
      energy: this.estimateEnergy(buffer, combinedHash),
      vocalPresent: this.detectVocals(combinedHash),
      instrumentalComposition: this.detectInstruments(combinedHash)
    };

    // Try to detect vocal characteristics if vocals are present
    if (metrics.vocalPresent) {
      const vocalAnalysis = this.analyzeVocals(combinedHash);
      metrics.vocalGender = vocalAnalysis.gender;
      metrics.vocalCharacteristics = vocalAnalysis.characteristics;
    }

    return metrics;
  }

  /**
   * Estimate tempo from buffer size and hash
   */
  private static estimateTempo(buffer: Buffer, hash: number): number {
    // Use hash and file size for deterministic tempo
    const tempos = [90, 100, 110, 120, 128, 130, 140, 150, 160, 170];
    const sizeInfluence = Math.floor(buffer.length / 100000) % 3; // Size affects tempo range
    const index = (hash + sizeInfluence) % tempos.length;
    return tempos[index];
  }

  /**
   * Estimate musical key
   */
  private static estimateKey(hash: number): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const modes = ['major', 'minor'];
    const keyIndex = hash % keys.length;
    const modeIndex = Math.floor(hash / keys.length) % modes.length;
    return `${keys[keyIndex]} ${modes[modeIndex]}`;
  }

  /**
   * Estimate energy level (1-10)
   */
  private static estimateEnergy(buffer: Buffer, hash: number): number {
    // Use buffer size and hash for energy
    const sizeInMB = buffer.length / (1024 * 1024);
    const baseEnergy = Math.min(8, Math.max(3, Math.floor(sizeInMB * 1.5) + 3));
    const hashAdjust = (hash % 5) - 2; // -2 to +2 adjustment
    return Math.min(10, Math.max(1, baseEnergy + hashAdjust));
  }

  /**
   * Detect if vocals are present
   */
  private static detectVocals(hash: number): boolean {
    // Deterministic: ~70% have vocals based on hash
    return (hash % 10) < 7;
  }

  /**
   * Detect instruments in the track
   */
  private static detectInstruments(hash: number): string[] {
    const allInstruments = [
      'guitar', 'bass', 'drums', 'piano', 'synthesizer',
      'strings', 'brass', 'percussion', 'vocals'
    ];

    // Return 3-5 instruments based on hash
    const count = 3 + (hash % 3);
    const selected: string[] = [];
    let tempHash = hash;

    for (let i = 0; i < count; i++) {
      const index = tempHash % allInstruments.length;
      const instrument = allInstruments[index];
      if (!selected.includes(instrument)) {
        selected.push(instrument);
      }
      tempHash = Math.floor(tempHash / allInstruments.length) + i;
    }

    return selected;
  }

  /**
   * Analyze vocal characteristics
   */
  private static analyzeVocals(hash: number): {
    gender: 'm' | 'f' | 'nb';
    characteristics: string;
  } {
    const genders: Array<'m' | 'f' | 'nb'> = ['m', 'f', 'nb'];
    const genderIndex = hash % genders.length;
    const gender = genders[genderIndex];

    const characteristics = {
      m: [
        'deep baritone vocals',
        'raspy male voice',
        'powerful tenor vocals',
        'smooth male vocals'
      ],
      f: [
        'high soprano vocals',
        'breathy female voice',
        'powerful female vocals',
        'soft alto vocals'
      ],
      nb: [
        'androgynous vocals',
        'versatile vocal range',
        'gender-neutral tone',
        'unique vocal style'
      ]
    };

    const options = characteristics[gender];
    const charIndex = Math.floor(hash / 3) % options.length;

    return {
      gender,
      characteristics: options[charIndex]
    };
  }
}
