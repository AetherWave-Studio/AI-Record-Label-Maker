import type { BandData } from './types.js';

/**
 * Trading Card Generator
 * Generates SVG trading cards for bands
 */
export class CardGenerator {
  /**
   * Generate SVG trading card
   */
  static generateCard(band: BandData, theme: 'dark' | 'light' | 'vibrant'): string {
    const colors = this.getThemeColors(theme);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="350" height="500" viewBox="0 0 350 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Card Background -->
  <rect width="350" height="500" fill="${colors.background}" rx="12"/>

  <!-- Header Gradient -->
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="350" height="100" fill="url(#headerGradient)" opacity="0.9"/>

  <!-- Band Name -->
  <text x="175" y="45"
        font-family="Arial, sans-serif"
        font-size="28"
        font-weight="bold"
        fill="${colors.text}"
        text-anchor="middle">
    ${this.escapeXml(band.bandName)}
  </text>

  <!-- Genre Badge -->
  <rect x="120" y="60" width="110" height="25" fill="${colors.badge}" rx="12" opacity="0.8"/>
  <text x="175" y="78"
        font-family="Arial, sans-serif"
        font-size="14"
        fill="${colors.badgeText}"
        text-anchor="middle">
    ${this.escapeXml(band.genre)}
  </text>

  <!-- Philosophy/Motto -->
  <text x="175" y="135"
        font-family="Arial, sans-serif"
        font-size="13"
        font-style="italic"
        fill="${colors.mutedText}"
        text-anchor="middle">
    "${this.escapeXml(this.truncate(band.philosophy || band.band_motto, 50))}"
  </text>

  <!-- Members Section -->
  <text x="20" y="170"
        font-family="Arial, sans-serif"
        font-size="16"
        font-weight="bold"
        fill="${colors.accent}">
    MEMBERS
  </text>

  ${this.renderMembers(band, colors, 190)}

  <!-- Signature Sound -->
  <text x="20" y="340"
        font-family="Arial, sans-serif"
        font-size="16"
        font-weight="bold"
        fill="${colors.accent}">
    SIGNATURE SOUND
  </text>
  <text x="20" y="365"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="${colors.text}">
    ${this.wrapText(band.signatureSound, 40)}
  </text>

  <!-- Tags -->
  <text x="20" y="410"
        font-family="Arial, sans-serif"
        font-size="16"
        font-weight="bold"
        fill="${colors.accent}">
    TAGS
  </text>

  ${this.renderTags(band.tags, colors, 430)}

  <!-- Footer -->
  <text x="175" y="480"
        font-family="Arial, sans-serif"
        font-size="10"
        fill="${colors.mutedText}"
        text-anchor="middle">
    AETHERWAVE VIRTUAL ARTIST
  </text>
</svg>`;

    return svg;
  }

  /**
   * Render band members
   */
  private static renderMembers(band: BandData, colors: any, startY: number): string {
    const members = band.members.slice(0, 3); // Max 3 for space
    return members.map((member, i) => {
      const y = startY + (i * 45);
      return `
        <rect x="20" y="${y - 15}" width="310" height="35" fill="${colors.memberBg}" rx="6" opacity="0.5"/>
        <text x="30" y="${y}"
              font-family="Arial, sans-serif"
              font-size="14"
              font-weight="bold"
              fill="${colors.text}">
          ${this.escapeXml(member.name)}
        </text>
        <text x="30" y="${y + 15}"
              font-family="Arial, sans-serif"
              font-size="11"
              fill="${colors.mutedText}">
          ${this.escapeXml(member.role)}
        </text>
      `;
    }).join('');
  }

  /**
   * Render tags
   */
  private static renderTags(tags: string[], colors: any, y: number): string {
    const displayTags = tags.slice(0, 4); // Max 4 tags
    return displayTags.map((tag, i) => {
      const x = 20 + (i * 80);
      return `
        <rect x="${x}" y="${y - 12}" width="70" height="20" fill="${colors.tagBg}" rx="10"/>
        <text x="${x + 35}" y="${y}"
              font-family="Arial, sans-serif"
              font-size="10"
              fill="${colors.tagText}"
              text-anchor="middle">
          ${this.escapeXml(tag.substring(0, 8))}
        </text>
      `;
    }).join('');
  }

  /**
   * Get theme colors
   */
  private static getThemeColors(theme: 'dark' | 'light' | 'vibrant') {
    const themes = {
      dark: {
        background: '#1a1a2e',
        primary: '#0f3460',
        secondary: '#16213e',
        accent: '#00ffff',
        text: '#ffffff',
        mutedText: '#aaaaaa',
        badge: '#e94560',
        badgeText: '#ffffff',
        memberBg: '#ffffff',
        tagBg: '#00ffff',
        tagText: '#000000'
      },
      light: {
        background: '#f5f5f5',
        primary: '#6c5ce7',
        secondary: '#a29bfe',
        accent: '#fd79a8',
        text: '#2d3436',
        mutedText: '#636e72',
        badge: '#fd79a8',
        badgeText: '#ffffff',
        memberBg: '#2d3436',
        tagBg: '#6c5ce7',
        tagText: '#ffffff'
      },
      vibrant: {
        background: '#0a0e27',
        primary: '#ff006e',
        secondary: '#8338ec',
        accent: '#ffbe0b',
        text: '#ffffff',
        mutedText: '#b8c5d6',
        badge: '#fb5607',
        badgeText: '#ffffff',
        memberBg: '#ffffff',
        tagBg: '#ffbe0b',
        tagText: '#000000'
      }
    };

    return themes[theme];
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Truncate text
   */
  private static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Wrap text to fit width
   */
  private static wrapText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return this.escapeXml(text);
    return this.escapeXml(text.substring(0, maxChars - 3) + '...');
  }

  /**
   * Convert SVG to base64 data URL
   */
  static toDataUrl(svg: string): string {
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}
