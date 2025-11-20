// Constants: define which traits are remixable
const REMIXABLE_TRAITS = [
  'bandName',
  'genre',
  'philosophy',
  'signatureSound',
  'origin_story',
  'breakthrough_moment'
];

// Types
interface Trait {
  key: string;
  label: string;
  value: string;
  remixable: boolean;
}

export interface RemixManifest {
  id: string;
  traits: Trait[];
}

export interface ExploreModeResult {
  winner: EnhancedBandData;
  alternatives: EnhancedBandData[];
  metadata: {
    mode: 'explore';
    processingTime: number;
    candidatesGenerated: number;
    scoring: number;
    finalized: boolean;
    selectedId: string | null;
  };
}

export interface EnhancedBandData {
  id: string;
  bandName: string;
  genre: string;
  philosophy: string;
  signatureSound: string;
  lyricalThemes: string;
  bandConcept: string;
  band_motto: string;
  influences: string[];
  mood: string[];
  world_building: {
    origin_story?: string;
    cultural_impact?: string;
    breakthrough_moment?: string;
    hidden_depths?: string;
  };
}
export function generateRemixManifests(explore: ExploreModeResult): RemixManifest[] {
  const allBands = [explore.winner, ...explore.alternatives];
  return allBands.map(band => generateManifest(band));
}
export function generateManifest(band: EnhancedBandData): RemixManifest {
  const traitMap: Record<string, string> = {
    bandName: band.bandName,
    genre: band.genre,
    philosophy: band.philosophy,
    signatureSound: band.signatureSound,
    origin_story: band.world_building?.origin_story ?? '',
    breakthrough_moment: band.world_building?.breakthrough_moment ?? '',
    lyricalThemes: band.lyricalThemes,
    bandConcept: band.bandConcept,
    band_motto: band.band_motto,
    influences: band.influences?.join(', ') ?? '',
    mood: band.mood?.join(', ') ?? ''
  };

  const traits: Trait[] = Object.entries(traitMap).map(([key, value]) => ({
    key,
    label: formatLabel(key),
    value,
    remixable: REMIXABLE_TRAITS.includes(key)
  }));

  return {
    id: band.id,
    traits
  };
}
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}