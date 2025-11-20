import { ArtistData } from "../core/types.js";

export function generateTradingCardSVG(
  artistData: ArtistData,
  imageUrl: string,
  artStyle: string = 'realistic',
  cardTheme: string = 'dark',
  userFame: number = 1
): string {
  const colors = artistData.colorPalette || {
    background: cardTheme === 'light' ? '#f0f8ff' : '#1a1a1a',
    textPrimary: cardTheme === 'light' ? '#191970' : '#f0f0f0',
    highlight: cardTheme === 'vibrant' ? '#ff00ff' : '#00ffff'
  };

  // Theme-based styling
  const themeColors = {
    dark: {
      cardBg: '#1a1a1a',
      headerBg: '#2a2a2a',
      textPrimary: '#f0f0f0',
      textSecondary: '#b0b0b0',
      accent: '#00ffff',
      border: '#444444'
    },
    light: {
      cardBg: '#ffffff',
      headerBg: '#f0f0f0',
      textPrimary: '#333333',
      textSecondary: '#666666',
      accent: '#0066cc',
      border: '#cccccc'
    },
    vibrant: {
      cardBg: '#1a0a2e',
      headerBg: '#ff00aa',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      accent: '#00ff88',
      border: '#ff00aa'
    }
  };

  const theme = themeColors[cardTheme as keyof typeof themeColors] || themeColors.dark;

  // Calculate metrics for display
  const totalStreams = (artistData as any).totalStreams || 0;
  const physicalCopies = (artistData as any).physicalCopies || 0;
  const digitalDownloads = (artistData as any).digitalDownloads || 0;
  
  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return `<svg width="350" height="500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${theme.cardBg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.background};stop-opacity:0.8" />
      </linearGradient>
      <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${theme.headerBg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Card Background -->
    <rect width="350" height="500" rx="12" fill="url(#cardGradient)" stroke="${theme.border}" stroke-width="2"/>
    
    <!-- Header Banner -->
    <rect width="350" height="60" rx="12" fill="url(#headerGradient)"/>
    <rect width="350" height="48" y="12" fill="url(#headerGradient)" opacity="0.8"/>
    
    <!-- FAME Score -->
    <circle cx="40" cy="30" r="18" fill="rgba(0,0,0,0.3)"/>
    <polygon points="40,20 42,26 48,26 43,30 45,36 40,32 35,36 37,30 32,26 38,26" fill="#ffd700"/>
    <text x="40" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">${userFame}</text>
    
    <!-- Title -->
    <text x="175" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white">VIRTUAL ARTIST</text>
    
    <!-- Trophy Icon -->
    <rect x="290" y="15" width="30" height="30" rx="15" fill="rgba(0,0,0,0.3)"/>
    <polygon points="305,22 307,25 311,25 308,28 309,32 305,30 301,32 302,28 299,25 303,25" fill="#ffd700"/>
    
    <!-- Artist Portrait -->
    <rect x="25" y="80" width="300" height="200" rx="8" fill="#333" stroke="white" stroke-width="2"/>
    ${imageUrl ? `<image x="25" y="80" width="300" height="200" href="${imageUrl}" preserveAspectRatio="xMidYMid slice" opacity="0.95"/>` : ''}
    
    <!-- Artist Name Banner -->
    <rect x="25" y="290" width="300" height="40" rx="4" fill="rgba(0,0,0,0.8)"/>
    <text x="175" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">${artistData.bandName || 'Unknown Artist'}</text>
    
    <!-- Genre -->
    <rect x="25" y="340" width="300" height="25" rx="4" fill="${theme.accent}" opacity="0.2"/>
    <text x="175" y="355" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${theme.accent}">${artistData.genre || 'Unknown'}</text>
    
    <!-- Stats Section -->
    <rect x="25" y="375" width="300" height="100" rx="4" fill="rgba(255,255,255,0.05)" stroke="${theme.border}"/>
    
    <!-- Stats Grid -->
    <text x="35" y="395" font-family="Arial, sans-serif" font-size="11" fill="${theme.textSecondary}">STREAMS</text>
    <text x="35" y="410" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${theme.accent}">${formatNumber(totalStreams)}</text>
    
    <text x="125" y="395" font-family="Arial, sans-serif" font-size="11" fill="${theme.textSecondary}">PHYSICAL</text>
    <text x="125" y="410" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${theme.accent}">${formatNumber(physicalCopies)}</text>
    
    <text x="215" y="395" font-family="Arial, sans-serif" font-size="11" fill="${theme.textSecondary}">DIGITAL</text>
    <text x="215" y="410" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${theme.accent}">${formatNumber(digitalDownloads)}</text>
    
    <!-- Members Count -->
    <text x="35" y="435" font-family="Arial, sans-serif" font-size="11" fill="${theme.textSecondary}">MEMBERS</text>
    <text x="35" y="450" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${theme.accent}">${artistData.members?.length || 1}</text>
    
    <!-- Philosophy -->
    <text x="125" y="435" font-family="Arial, sans-serif" font-size="11" fill="${theme.textSecondary}">STYLE</text>
    <text x="125" y="450" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${theme.accent}">${(artistData.philosophy || 'Original').substring(0, 12)}</text>
    
    <!-- Rarity Indicator -->
    <rect x="275" y="430" width="40" height="20" rx="10" fill="${theme.accent}" opacity="0.3"/>
    <text x="295" y="442" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${theme.accent}">RARE</text>
    
    <!-- Bottom Border Accent -->
    <rect x="25" y="485" width="300" height="3" rx="2" fill="url(#headerGradient)"/>
  </svg>`;
}

export function generateTradingCardImage(
  artistData: ArtistData,
  imageUrl: string,
  artStyle: string = 'realistic',
  cardTheme: string = 'dark',
  userFame: number = 1
): string {
  const svgContent = generateTradingCardSVG(artistData, imageUrl, artStyle, cardTheme, userFame);
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}