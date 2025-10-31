import type { CardDesignType } from "@shared/schema";

/**
 * DALL-E Prompt Templates for Trading Card Designs
 * 
 * These templates define visual styling that DALL-E applies to the trading card layout.
 * The layout structure stays consistent (header, portrait, genre, quote, members)
 * but DALL-E "paints" different visual styles onto it.
 */

export interface CardStylePrompt {
  designId: CardDesignType;
  styleDescription: string;
  headerStyle: string;
  borderStyle: string;
  backgroundStyle: string;
  portraitStyle: string;
  textStyle: string;
}

export const CARD_DESIGN_PROMPTS: Record<CardDesignType, CardStylePrompt> = {
  ghosts_online: {
    designId: 'ghosts_online',
    styleDescription: 'Clean professional trading card with dark aesthetic',
    headerStyle: 'Bold "GHOSTS ONLINE" text in white/cyan, centered header with dark blue gradient background',
    borderStyle: 'Clean cyan/teal borders, subtle glow effect, rounded corners',
    backgroundStyle: 'Dark slate/charcoal gradient background (navy to dark gray)',
    portraitStyle: 'Professional band photo with white border frame, clean presentation',
    textStyle: 'White and light cyan text, clean sans-serif font, high contrast',
  },

  cyberpunk_holo: {
    designId: 'cyberpunk_holo',
    styleDescription: 'Futuristic holographic trading card with rainbow gradient effects',
    headerStyle: 'Glowing "CYBERPUNK" text with neon glow, holographic rainbow gradient header',
    borderStyle: 'Rainbow gradient glowing borders (teal→purple→pink→orange), circuit board patterns etched into border edges, holographic shimmer effects, neon glow',
    backgroundStyle: 'Deep purple/indigo gradient with circuit pattern overlay, digital glitch effects, holographic sheen',
    portraitStyle: 'Band photo with holographic overlay effects, neon edge glow, cyberpunk aesthetic, digital grain texture',
    textStyle: 'Bright neon text (pink, cyan, purple), futuristic font, glowing effect',
  },

  vintage_weathered: {
    designId: 'vintage_weathered',
    styleDescription: 'Aged vintage trading card with weathered paper texture',
    headerStyle: 'Serif "VINTAGE" text in aged cream/sepia tones, decorative corner flourishes',
    borderStyle: 'Ornate decorative borders with corner flourishes, weathered edges, aged paper texture, slight tears and wear',
    backgroundStyle: 'Aged cream/beige paper texture, coffee stains, vintage patina, weathered appearance',
    portraitStyle: 'Band photo with sepia tone treatment, slight fading, vintage photograph aesthetic with edge wear',
    textStyle: 'Dark brown/sepia text on aged paper, classic serif font, slightly faded ink effect',
  },

  modern_sleek: {
    designId: 'modern_sleek',
    styleDescription: 'Ultra-modern premium trading card with stage lighting effects',
    headerStyle: 'Bold "MODERN" text in crisp white, minimalist clean header with subtle gradient',
    borderStyle: 'Sleek thin black borders with metallic silver accents, sharp corners, premium finish',
    backgroundStyle: 'Deep black to charcoal gradient, stage spotlight effects, professional studio lighting',
    portraitStyle: 'High-contrast professional band photo with dramatic stage lighting, crisp focus, concert photography style',
    textStyle: 'Bright white text on dark background, modern sans-serif typography, high contrast',
  },

  neon_arcade: {
    designId: 'neon_arcade',
    styleDescription: 'Retro 80s arcade trading card with neon colors and pixel effects',
    headerStyle: 'Bold "NEON ARCADE" text in bright neon pink/cyan, retro 80s arcade font with glow',
    borderStyle: 'Bright neon pink and cyan borders, retro grid pattern, 80s style geometric shapes, pixel effects',
    backgroundStyle: 'Deep purple/blue gradient with neon grid overlay, 80s vaporwave aesthetic, retro sun rays',
    portraitStyle: 'Band photo with neon edge glow, retro VHS scan line effects, 80s music video aesthetic',
    textStyle: 'Bright neon pink and cyan text, retro arcade font, glowing neon sign effect',
  },

  dark_carnival: {
    designId: 'dark_carnival',
    styleDescription: 'Spooky Halloween-themed trading card with dark mystique',
    headerStyle: 'Eerie "DARK CARNIVAL" text in orange/purple, gothic font with mist effects',
    borderStyle: 'Dark purple and orange borders, spooky carnival patterns, bats and mist decorations, gothic ornaments',
    backgroundStyle: 'Deep black to dark purple gradient, misty atmosphere, Halloween night sky, carnival tent silhouettes',
    portraitStyle: 'Band photo with eerie purple/orange lighting, mysterious fog effects, spooky atmospheric treatment',
    textStyle: 'Orange and purple text, gothic font, slightly distressed effect',
  },

  winter_frost: {
    designId: 'winter_frost',
    styleDescription: 'Icy winter wonderland trading card with frost effects',
    headerStyle: 'Frozen "WINTER FROST" text in icy blue/white, crystalline ice font with sparkles',
    borderStyle: 'Icy blue borders with frost patterns, snowflake decorations, crystalline edges, winter sparkles',
    backgroundStyle: 'Deep blue to white gradient, falling snow, frost patterns, winter wonderland atmosphere',
    portraitStyle: 'Band photo with cool blue tones, frost overlay effects, winter atmospheric lighting',
    textStyle: 'Ice blue and white text, crisp clean font, frosted glass effect',
  },

  gold_anniversary: {
    designId: 'gold_anniversary',
    styleDescription: 'Premium gold anniversary edition trading card with luxurious accents',
    headerStyle: 'Elegant "GOLD ANNIVERSARY" text in metallic gold, premium embossed effect',
    borderStyle: 'Luxurious gold borders with ornate patterns, metallic shine, premium embossed details, celebration motifs',
    backgroundStyle: 'Deep black to charcoal gradient with gold particle effects, premium luxurious atmosphere',
    portraitStyle: 'Band photo with warm golden lighting, premium treatment, celebration atmosphere',
    textStyle: 'Metallic gold and white text, elegant serif font, premium embossed effect',
  },
};

/**
 * Generate complete DALL-E prompt for trading card image
 * 
 * This combines the card design style with the band's data to create
 * a complete prompt that DALL-E will use to generate the trading card image.
 */
export function generateCardPrompt(
  designId: CardDesignType,
  bandData: {
    bandName: string;
    genre: string;
    tagline?: string;
    members?: Array<{ name: string; role: string }>;
  }
): string {
  const style = CARD_DESIGN_PROMPTS[designId];
  
  // Build member list string
  const memberList = bandData.members
    ?.slice(0, 4)
    .map(m => `${m.name} - ${m.role}`)
    .join(', ') || 'Solo Artist';

  // Construct the complete DALL-E prompt
  const prompt = `
Professional trading card design for band "${bandData.bandName}".

LAYOUT STRUCTURE (strict):
- Header: ${style.headerStyle}
- Large central portrait area with band photo (60% of card height)
- Genre badge: "${bandData.genre}" badge below portrait
${bandData.tagline ? `- Quote box: "${bandData.tagline}" in white box` : ''}
- Bottom member list: ${memberList}

VISUAL STYLE:
${style.styleDescription}

BORDER & FRAME:
${style.borderStyle}

BACKGROUND:
${style.backgroundStyle}

PORTRAIT TREATMENT:
${style.portraitStyle}

TEXT STYLING:
${style.textStyle}

TECHNICAL SPECS:
- Aspect ratio: 3.5:5 (portrait trading card format)
- Professional quality, high detail
- Readable text at all sizes
- Balanced composition
- No text overflow or margin issues
  `.trim();

  return prompt;
}

/**
 * Get shortened style description for UI display
 */
export function getStyleDescription(designId: CardDesignType): string {
  return CARD_DESIGN_PROMPTS[designId].styleDescription;
}
