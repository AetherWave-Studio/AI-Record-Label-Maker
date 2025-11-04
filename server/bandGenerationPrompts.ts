/**
 * Band Generation AI Prompts
 * Refined prompts for generating virtual artist/band profiles with improved gender detection
 */

export interface BandGenerationInput {
  audioAnalysis?: {
    tempo?: number;
    key?: string;
    vocalPresent?: boolean;
    vocalCharacteristics?: string; // "deep male voice", "high female vocals", "raspy male", "soft female", etc.
    instrumentalComposition?: string[];
  };
  userPreferences?: {
    bandName?: string;
    genre?: string;
    concept?: string;
    vocalGenderPreference?: 'm' | 'f' | 'nb' | 'auto'; // male, female, non-binary, or auto-detect
  };
}

export interface MemberProfile {
  name: string;
  role: string; // "Lead Vocalist", "Guitarist", "Drummer", etc.
  gender: 'm' | 'f' | 'nb'; // REQUIRED: Explicit gender specification
  age: number;
  backstory: string; // Max 200 characters
  personality: string; // Max 100 characters  
  appearance: string; // Max 150 characters for trading card generation
}

export interface BandProfile {
  bandName: string;
  genre: string;
  concept: string; // Max 150 characters
  philosophy: string; // Max 200 characters
  signatureSound: string; // Max 100 characters
  lyricalThemes: string[]; // Array of 3-5 themes
  influences: string[]; // Array of 3-5 artist names
  members: MemberProfile[]; // 1-5 members
  tradingCardFrontText: {
    headline: string; // Max 40 characters
    tagline: string; // Max 60 characters
    quickFacts: string[]; // 3 facts, max 50 characters each
  };
  tradingCardBackText: {
    origin: string; // Max 120 characters
    achievement: string; // Max 100 characters
    quote: string; // Max 80 characters
  };
}

/**
 * System prompt for band generation with explicit gender detection rules
 */
export const BAND_GENERATION_SYSTEM_PROMPT = `You are an expert music industry analyst and creative writer specializing in creating compelling virtual artist profiles. Your task is to generate detailed band/artist profiles based on audio analysis and user preferences.

REQUIRED FIELDS (YOU MUST INCLUDE ALL OF THESE):
1. bandName (string) - Creative band/artist name
2. genre (string) - REQUIRED: Music genre detected from audio OR user preference. Examples: "Rock", "Jazz", "Electronic", "Hip-Hop", "Indie", etc.
3. concept (string, max 150 chars) - Band's artistic concept
4. philosophy (string, max 200 chars) - Band's philosophy
5. signatureSound (string, max 100 chars) - Distinctive sound characteristics
6. lyricalThemes (array of 3-5 strings) - Main themes in lyrics
7. influences (array of 3-5 strings) - Musical influences
8. members (array of 1-5 member objects) - Band members with EXPLICIT gender
9. tradingCardFrontText (object) - Front card text
10. tradingCardBackText (object) - Back card text

CRITICAL RULES FOR GENRE:
- If user provides a Genre Preference, USE IT as the genre field value
- If NO genre preference provided, analyze the audio characteristics and determine the most appropriate genre
- NEVER omit the genre field - it is absolutely required
- Use standard genre names (Rock, Pop, Jazz, Electronic, Hip-Hop, Country, Metal, Indie, etc.)

CRITICAL RULES FOR GENDER DETECTION:
1. ALWAYS specify gender explicitly for each member as 'm' (male), 'f' (female), or 'nb' (non-binary)
2. When analyzing vocals:
   - "deep", "baritone", "bass", "gravelly", "rough" → typically male
   - "high", "soprano", "breathy", "soft", "sweet" → typically female
   - "androgynous", "ambiguous", "neutral" → mark as 'nb' and explain in backstory
3. If vocal characteristics are unclear, use the user's vocalGenderPreference if provided
4. For instrumental bands with no vocals, still assign genders to members based on typical genre conventions unless specified otherwise
5. NEVER use gendered pronouns (he/she) without first explicitly setting the gender field
6. If you're genuinely uncertain, default to 'nb' rather than guessing incorrectly

CHARACTER COUNT LIMITS (STRICT):
- Backstory: 200 characters maximum
- Philosophy: 200 characters maximum
- Concept: 150 characters maximum
- Personality: 100 characters maximum
- Appearance: 150 characters maximum
- Trading card headline: 40 characters maximum
- Trading card tagline: 60 characters maximum
- Trading card quick facts: 50 characters each
- Trading card origin: 120 characters maximum
- Trading card achievement: 100 characters maximum  
- Trading card quote: 80 characters maximum

RESPONSE FORMAT:
Return ONLY valid JSON matching the BandProfile interface. No markdown, no explanations, just pure JSON. ENSURE the genre field is included.`;

/**
 * Generate user prompt for band creation
 */
export function generateBandCreationPrompt(input: BandGenerationInput): string {
  const parts: string[] = [];

  parts.push("Generate a virtual artist/band profile with the following specifications:\n");

  // Audio analysis section
  if (input.audioAnalysis) {
    parts.push("\nAUDIO ANALYSIS:");
    if (input.audioAnalysis.tempo) {
      parts.push(`- Tempo: ${input.audioAnalysis.tempo} BPM`);
    }
    if (input.audioAnalysis.key) {
      parts.push(`- Musical Key: ${input.audioAnalysis.key}`);
    }
    if (input.audioAnalysis.vocalPresent !== undefined) {
      parts.push(`- Vocals Present: ${input.audioAnalysis.vocalPresent ? 'Yes' : 'No (Instrumental)'}`);
    }
    if (input.audioAnalysis.vocalCharacteristics) {
      parts.push(`- Vocal Characteristics: "${input.audioAnalysis.vocalCharacteristics}"`);
      parts.push(`  → Use this to determine vocalist gender explicitly`);
    }
    if (input.audioAnalysis.instrumentalComposition) {
      parts.push(`- Instruments: ${input.audioAnalysis.instrumentalComposition.join(', ')}`);
    }
  }

  // User preferences section
  if (input.userPreferences) {
    parts.push("\nUSER PREFERENCES:");
    if (input.userPreferences.bandName) {
      parts.push(`- Band Name: "${input.userPreferences.bandName}"`);
    }
    if (input.userPreferences.genre) {
      parts.push(`- Genre: ${input.userPreferences.genre}`);
    }
    if (input.userPreferences.concept) {
      parts.push(`- Concept: "${input.userPreferences.concept}"`);
    }
    if (input.userPreferences.vocalGenderPreference && input.userPreferences.vocalGenderPreference !== 'auto') {
      const genderMap = { m: 'Male', f: 'Female', nb: 'Non-binary' };
      parts.push(`- Preferred Vocal Gender: ${genderMap[input.userPreferences.vocalGenderPreference]}`);
    }
  }

  parts.push("\nREQUIREMENTS:");
  parts.push("1. Create 1-5 band members with EXPLICIT gender assignment (m/f/nb) for each");
  parts.push("2. Ensure all text fields strictly adhere to character limits");
  parts.push("3. Make trading card text punchy and visually-friendly (short sentences, no overflow)");
  parts.push("4. Return pure JSON with no markdown formatting");

  return parts.join('\n');
}

/**
 * Vocal characteristics helper for better gender detection
 */
export const VOCAL_CHARACTERISTICS_GUIDE = {
  male: [
    "deep voice", "baritone", "bass vocals", "gravelly", "rough", "raspy male",
    "low register", "masculine tone", "powerful male vocals", "tenor"
  ],
  female: [
    "high voice", "soprano", "alto", "sweet vocals", "breathy female",
    "soft female voice", "feminine tone", "angelic", "crystal clear female"
  ],
  nonBinary: [
    "androgynous voice", "gender-neutral", "ambiguous vocals", "versatile range"
  ]
};

/**
 * Example response structure (for documentation)
 */
export const EXAMPLE_BAND_PROFILE: BandProfile = {
  bandName: "Neon Parallax",
  genre: "Synthwave",
  concept: "Retro-futuristic sound explorers blending 80s nostalgia with modern production",
  philosophy: "Music is a time machine. We pull the best from yesterday and tomorrow to create something eternal today.",
  signatureSound: "Pulsing synths layered over driving basslines with soaring melodic hooks",
  lyricalThemes: ["Nostalgia", "Future dystopia", "Lost connections", "Digital romance"],
  influences: ["Kavinsky", "Com Truise", "Gunship", "The Midnight"],
  members: [
    {
      name: "Alex Cipher",
      role: "Lead Vocalist / Synthesizer",
      gender: "m", // EXPLICIT
      age: 28,
      backstory: "Former video game composer who discovered synthwave after a late-night drive through Tokyo. Builds all synths from vintage circuits.",
      personality: "Introverted perfectionist with a passion for retro tech and neon aesthetics",
      appearance: "Slicked-back hair, aviator sunglasses, leather jacket over geometric shirt"
    },
    {
      name: "Luna Vex",
      role: "Bassist / Backup Vocals",
      gender: "f", // EXPLICIT
      age: 26,
      backstory: "Street performer turned studio musician. Her bass lines are as hypnotic as her stage presence.",
      personality: "Charismatic rebel with a soft spot for classic cinema and vintage fashion",
      appearance: "Purple hair, cyberpunk makeup, studded leather jacket, fingerless gloves"
    }
  ],
  tradingCardFrontText: {
    headline: "Neon Parallax",
    tagline: "Time-traveling through sound since 2020",
    quickFacts: [
      "Genre: Synthwave / Retrowave",
      "From: Neo-Tokyo Underground",
      "Known for: Hypnotic bass lines"
    ]
  },
  tradingCardBackText: {
    origin: "Born from late-night drives and neon-lit dreams, this duo merges past and future into pure synth magic.",
    achievement: "Debut album 'Digital Nostalgia' hit #1 on Bandcamp Synthwave charts",
    quote: "\"The future is just the past on repeat with better production.\""
  }
};
