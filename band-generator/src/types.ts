/**
 * Band Generator Types
 */

export interface AudioMetrics {
  tempo?: number;
  key?: string;
  energy?: number;
  vocalPresent?: boolean;
  vocalGender?: 'm' | 'f' | 'nb';
  vocalCharacteristics?: string;
  instrumentalComposition?: string[];
}

export interface BandMember {
  name: string;
  role: string;
  archetype: string;
  background: string;
  personality?: string;
  appearance?: string;
}

export interface WorldBuilding {
  origin_story: string;
  fanbase_description?: string;
  iconic_moment?: string;
}

export interface BandData {
  bandName: string;
  songName: string;
  genre: string;
  philosophy: string;
  bandConcept: string;
  members: BandMember[];
  signatureSound: string;
  influences: string[];
  tags: string[];
  artStyle: string;
  band_identity: string;
  band_motto: string;
  world_building: WorldBuilding;
  imageUrl?: string;
  cardImageUrl?: string;
}

export type Genre =
  | 'Rock'
  | 'Alternative Rock'
  | 'Heavy Metal'
  | 'Goth'
  | 'Industrial'
  | 'Synthpop'
  | 'Ambient'
  | 'Experimental'
  | 'Punk'
  | 'Jazz'
  | 'Pop';

export interface GenerationOptions {
  mode: 'explore' | 'refine';
  artStyle: 'realistic' | 'anime' | 'abstract';
  cardTheme: 'dark' | 'light' | 'vibrant';
  userBandName?: string;
  songName?: string;
  userGenre?: Genre;
  artistType?: 'solo' | 'ensemble';
}

export const defaultGenerationOptions: GenerationOptions = {
  mode: 'explore',
  artStyle: 'realistic',
  cardTheme: 'dark',
}

export interface ScoringMetrics {
  novelty: number;
  clarity: number;
  brandFit: number;
  constraintFit: number;
  total: number;
}

export interface GenerationResult {
  winner: BandData;
  alternatives?: BandData[];
  metadata: {
    mode: string;
    processingTime: number;
    candidatesGenerated: number;
    scoring?: ScoringMetrics;
  };
}
