import OpenAI from 'openai';
import type { AudioMetrics, BandData, GenerationOptions, GenerationResult, ScoringMetrics } from './types.js';

/**
 * Band Generation System Prompt
 */
const SYSTEM_PROMPT = `You are an expert music industry analyst and creative writer specializing in creating compelling virtual artist profiles.

Generate detailed band/artist profiles as valid JSON with these fields:
{
  "bandName": "string",
  "songName": "string",
  "genre": "string",
  "philosophy": "string (max 200 chars)",
  "bandConcept": "string (max 300 chars)",
  "members": [
    {
      "name": "string",
      "role": "string",
      "archetype": "string",
      "background": "string (max 200 chars)"
    }
  ],
  "signatureSound": "string (max 150 chars)",
  "influences": ["string", "string", "string"],
  "tags": ["string", "string", "string"],
  "band_identity": "string (max 200 chars)",
  "band_motto": "string (max 100 chars)",
  "world_building": {
    "origin_story": "string (max 300 chars)"
  }
}

Rules:
- Use audio metrics to inform genre, energy, and style
- Create 2-5 band members with distinct personalities
- Make it creative and compelling
- Return ONLY valid JSON, no markdown, no explanations`;

/**
 * Enhanced Band Generator
 */
export class BandGenerator {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate band from audio metrics
   */
  async generateBand(
    audioMetrics: AudioMetrics,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    if (options.mode === 'explore') {
      return await this.generateExploreMode(audioMetrics, options, startTime);
    } else {
      return await this.generateRefineMode(audioMetrics, options, startTime);
    }
  }

  /**
   * Explore mode: Generate 4 candidates and pick the best
   */
  private async generateExploreMode(
    audioMetrics: AudioMetrics,
    options: GenerationOptions,
    startTime: number
  ): Promise<GenerationResult> {
    console.log('🎨 Generating 4 band candidates...');

    // Generate 4 candidates in parallel
    const candidates = await Promise.all([
      this.generateSingleBand(audioMetrics, options, 1),
      this.generateSingleBand(audioMetrics, options, 2),
      this.generateSingleBand(audioMetrics, options, 3),
      this.generateSingleBand(audioMetrics, options, 4)
    ]);

    // Score each candidate
    const scoredCandidates = candidates.map(band => ({
      band,
      score: this.scoreBand(band, audioMetrics, options)
    }));

    // Sort by score
    scoredCandidates.sort((a, b) => b.score.total - a.score.total);

    const winner = scoredCandidates[0];
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Selected winner: ${winner.band.bandName} (score: ${winner.score.total.toFixed(2)})`);

    return {
      winner: winner.band,
      alternatives: scoredCandidates.slice(1).map(c => c.band),
      metadata: {
        mode: 'explore',
        processingTime,
        candidatesGenerated: 4,
        scoring: winner.score
		
		// After const winner = scoredCandidates[0]; (in explore) or enhancedData (in refine)
// Force image gen (calls your separate ts)
const imagePrompt = `Realistic image of ${winner.band.bandName}: high-energy 80's rock band with 5 male members, progressive instrumental style.`;
const imageResponse = await this.openai.images.generate({
  model: 'dall-e-3',
  prompt: imagePrompt,
  size: '1024x1024'
});
winner.band.imageUrl = imageResponse.data[0].url || 'No image available'; // Fallback

// Force card SVG (calls cardGenerator.ts)
const cardSvg = CardGenerator.generateCard(winner.band, options.cardTheme || 'dark');
winner.band.cardImageUrl = CardGenerator.toDataUrl(cardSvg);

// Force PDF (calls PDF-GENERATION.md)
const pdfBuffer = await generateBandProfilePDF(winner.band, winner.band.imageUrl);
const pdfFilename = `${winner.band.bandName.replace(/\s/g, '-')}-profile.pdf`;
fs.writeFileSync(`public/${pdfFilename}`, pdfBuffer); // Save (or S3 for prod)
winner.band.pdfUrl = `http://localhost:5001/public/${pdfFilename}`; // Add to JSON
      }
    };
  }

  /**
   * Refine mode: Generate single polished result
   */
  private async generateRefineMode(
    audioMetrics: AudioMetrics,
    options: GenerationOptions,
    startTime: number
  ): Promise<GenerationResult> {
    console.log('🎯 Generating refined band...');

    const band = await this.generateSingleBand(audioMetrics, options, 1);
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Generated: ${band.bandName}`);

    return {
      winner: band,
      metadata: {
        mode: 'refine',
        processingTime,
        candidatesGenerated: 1
      }
    };
  }

  /**
   * Generate a single band
   */
  private async generateSingleBand(
    audioMetrics: AudioMetrics,
    options: GenerationOptions,
    iteration: number
  ): Promise<BandData> {
    const userPrompt = this.buildUserPrompt(audioMetrics, options);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8 + (iteration * 0.05), // Vary temperature for diversity
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const bandData = JSON.parse(content) as BandData;

      // Apply user overrides
      if (options.userBandName) bandData.bandName = options.userBandName;
      if (options.songName) bandData.songName = options.songName;
      if (options.userGenre) bandData.genre = options.userGenre;
      bandData.artStyle = options.artStyle;

      return bandData;
    } catch (error) {
      console.error(`Error generating band (iteration ${iteration}):`, error);
      throw error;
    }
  }

  /**
   * Build user prompt from audio metrics and options
   */
  private buildUserPrompt(audioMetrics: AudioMetrics, options: GenerationOptions): string {
    const parts: string[] = [];

    parts.push('Generate a virtual band/artist profile based on:');
    parts.push('');

    // Audio analysis
    if (Object.keys(audioMetrics).length > 0) {
      parts.push('AUDIO ANALYSIS:');
      if (audioMetrics.tempo) parts.push(`- Tempo: ${audioMetrics.tempo} BPM`);
      if (audioMetrics.key) parts.push(`- Key: ${audioMetrics.key}`);
      if (audioMetrics.energy) parts.push(`- Energy: ${audioMetrics.energy}/10`);
      if (audioMetrics.vocalPresent !== undefined) {
        parts.push(`- Vocals: ${audioMetrics.vocalPresent ? 'Yes' : 'No (Instrumental)'}`);
      }
      if (audioMetrics.vocalGender) {
        const genderMap = { m: 'Male', f: 'Female', nb: 'Non-binary' };
        parts.push(`- Vocal Gender: ${genderMap[audioMetrics.vocalGender]}`);
      }
      if (audioMetrics.vocalCharacteristics) {
        parts.push(`- Vocal Style: ${audioMetrics.vocalCharacteristics}`);
      }
      parts.push('');
    }

    // User preferences
    parts.push('REQUIREMENTS:');
    parts.push(`- Art Style: ${options.artStyle}`);
    parts.push(`- Artist Type: ${options.artistType || 'ensemble'}`);
    if (options.userGenre) parts.push(`- Genre: ${options.userGenre}`);
    if (options.songName) parts.push(`- Song Name: "${options.songName}"`);

    parts.push('');
    parts.push('Make it creative, unique, and compelling!');

    return parts.join('\n');
  }

  /**
   * Score a band based on various criteria
   */
  private scoreBand(band: BandData, audioMetrics: AudioMetrics, options: GenerationOptions): ScoringMetrics {
    let novelty = 5.0;
    let clarity = 5.0;
    let brandFit = 5.0;
    let constraintFit = 5.0;

    // Novelty: Check for unique elements
    if (band.influences && band.influences.length >= 3) novelty += 1;
    if (band.tags && band.tags.length >= 4) novelty += 1;
    if (band.members && band.members.length >= 2) novelty += 1;
    if (band.world_building?.origin_story) novelty += 1;

    // Clarity: Check completeness
    if (band.bandName && band.bandName.length > 3) clarity += 1;
    if (band.genre && band.genre.length > 2) clarity += 1;
    if (band.philosophy && band.philosophy.length > 10) clarity += 1;
    if (band.band_motto && band.band_motto.length > 5) clarity += 1;

    // Brand fit: Check style alignment
    if (band.artStyle === options.artStyle) brandFit += 2;
    if (options.userGenre && band.genre.toLowerCase().includes(options.userGenre.toLowerCase())) {
      brandFit += 2;
    }

    // Constraint fit: Check character limits
    if (band.philosophy && band.philosophy.length <= 200) constraintFit += 1;
    if (band.bandConcept && band.bandConcept.length <= 300) constraintFit += 1;
    if (band.band_motto && band.band_motto.length <= 100) constraintFit += 1;
    if (band.signatureSound && band.signatureSound.length <= 150) constraintFit += 1;

    const total = (novelty + clarity + brandFit + constraintFit) / 4;

    return { novelty, clarity, brandFit, constraintFit, total };
  }
}
