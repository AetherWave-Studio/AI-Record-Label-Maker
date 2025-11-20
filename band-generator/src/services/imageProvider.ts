import { BandData } from "../types.js";
import { fetch, ProxyAgent } from "undici";

// API response interfaces
interface KieCreateTaskResponse {
  code: number;
  msg?: string;
  data?: {
    taskId: string;
    recordId: string;
  };
}

interface KieTaskStatusResponse {
  code: number;
  msg?: string;
  data?: {
    state: string;
    resultJson?: string;
  };
}

interface ImageResultJson {
  resultUrls?: string[];
}

// Create proxy agent for KIE API calls
function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = process.env.WEBSHARE_PROXY;
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

// Poll for task completion
async function pollForResult(taskId: string, maxAttempts: number = 60): Promise<string> {
  const dispatcher = getProxyAgent();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait 2 seconds between polls
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.KIE_API_KEY}`,
      },
      dispatcher
    });

    const result = await response.json() as KieTaskStatusResponse;

    if (result.code !== 200) {
      throw new Error(`Task status check failed: ${result.msg || "Unknown error"}`);
    }

    if (result.data?.state === "success" && result.data.resultJson) {
      const resultJson = JSON.parse(result.data.resultJson) as ImageResultJson;
      const imageUrl = resultJson.resultUrls?.[0];

      if (!imageUrl) {
        throw new Error("No image URL in result");
      }

      return imageUrl;
    }

    if (result.data?.state === "failed") {
      throw new Error("Image generation task failed");
    }

    // Still processing, continue polling
    if (attempt % 5 === 0) {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts}, state: ${result.data?.state || 'pending'}`);
    }
  }

  throw new Error("Task timed out waiting for result");
}

// Color palette type for band styling
interface ColorPalette {
  background: string;
  highlight: string;
  textPrimary: string;
}

// Generate color palette from band data
function generateColorPalette(bandData: BandData, cardTheme: string): ColorPalette {
  const genre = bandData.genre.toLowerCase();

  // Base colors by theme
  const themeColors: Record<string, ColorPalette> = {
    dark: {
      background: '#1a1a2e',
      highlight: '#00ffff',
      textPrimary: '#ffffff'
    },
    light: {
      background: '#f0f8ff',
      highlight: '#4169e1',
      textPrimary: '#191970'
    },
    vibrant: {
      background: '#4a0e4e',
      highlight: '#ff00ff',
      textPrimary: '#00ffff'
    }
  };

  let colors = themeColors[cardTheme] || themeColors.dark;

  // Adjust based on genre
  if (genre.includes('rock') || genre.includes('metal')) {
    colors.highlight = cardTheme === 'vibrant' ? '#ff0000' : '#ff4500';
  } else if (genre.includes('electronic') || genre.includes('synth')) {
    colors.highlight = cardTheme === 'light' ? '#00bfff' : '#00ffff';
  } else if (genre.includes('jazz') || genre.includes('blues')) {
    colors.highlight = cardTheme === 'vibrant' ? '#ffd700' : '#daa520';
  } else if (genre.includes('pop')) {
    colors.highlight = cardTheme === 'dark' ? '#ff69b4' : '#ff1493';
  }

  return colors;
}

export function buildImagePrompt(
  bandData: BandData,
  artStyle: string,
  theme: string
): string {
  const memberCount = bandData.members.length;
  const genre = bandData.genre.toLowerCase();

  // Theme-based lighting and mood
  const themeDescriptor = theme === "light" ? "bright, natural lighting with vibrant colors" :
                         theme === "vibrant" ? "dramatic colorful lighting with electric atmosphere" :
                         "moody atmospheric lighting with deep shadows";

  // Art style prefix
  const stylePrefix = artStyle === "realistic" ? "photorealistic" :
                      artStyle === "anime" ? "anime style" :
                      artStyle === "abstract" ? "abstract geometric" :
                      "stylized digital illustration";

  // Enhanced theme-based styling
  const enhancedThemeDescriptor = theme === "vibrant" ?
    "dramatic neon lighting with electric purple, magenta, and cyan colors, high contrast, synthwave aesthetic" :
    themeDescriptor;

  // Build prompt based on member count
  let prompt: string;

  if (memberCount === 1) {
    if (genre.includes('electronic')) {
      prompt = `${stylePrefix} cinematic portrait of a solo electronic music producer in a dimly lit studio. Close-up shot focusing on their face, looking pensively down at their equipment. ${enhancedThemeDescriptor}. Synthesizer LED lights providing ambient glow. Professional music photography with artistic depth and mood.`;
    } else {
      prompt = `${stylePrefix} artistic portrait of a solo ${genre} musician. Dramatic close-up composition with the artist looking down pensively. ${enhancedThemeDescriptor}. Strong directional lighting creating bold shadows across their face. Professional music industry photography aesthetic.`;
    }
  } else if (memberCount === 2) {
    prompt = `${stylePrefix} professional duo portrait of ${genre} artists. Creative composition showing musical chemistry between the two members. One member prominently featured in foreground, second member artistically positioned in background with subtle depth blur. ${enhancedThemeDescriptor}. Dramatic studio lighting with creative shadows.`;
  } else if (memberCount === 3) {
    prompt = `${stylePrefix} professional trio portrait of ${genre} band. Lead member prominently featured in foreground with sharp focus. Two supporting band members positioned behind in creative formation with artistic depth blur. ${enhancedThemeDescriptor}. Dramatic directional lighting creating visual depth and layers.`;
  } else {
    prompt = `${stylePrefix} professional band portrait of ${memberCount}-member ${genre} band "${bandData.bandName}". Lead member prominently featured in foreground with supporting members arranged in creative formation behind. ${enhancedThemeDescriptor}. Dramatic studio lighting with multiple light sources creating depth and visual layers.`;
  }

  return prompt;
}
async function generateWithSeedream(prompt: string): Promise<string> {
  const dispatcher = getProxyAgent();
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.KIE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "bytedance/seedream-v4-text-to-image",
      callBackUrl: null,
      input: {
        prompt,
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1,
        seed: null
      }
    }),
    dispatcher
  });

  const result = await response.json() as KieCreateTaskResponse;

  if (result.code !== 200 || !result.data?.taskId) {
    throw new Error(`Seedream task creation failed: ${result.msg || "Unknown error"}`);
  }

  console.log(`Seedream task created: ${result.data.taskId}`);
  return await pollForResult(result.data.taskId);
}

async function generateWithNanoBanano(prompt: string): Promise<string> {
  const dispatcher = getProxyAgent();
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.KIE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/nano-banana",
      callBackUrl: null,
      input: {
        prompt,
        output_format: "png",
        image_size: "1:1"
      }
    }),
    dispatcher
  });

  const result = await response.json() as KieCreateTaskResponse;

  if (result.code !== 200 || !result.data?.taskId) {
    throw new Error(`Nano Banana task creation failed: ${result.msg || "Unknown error"}`);
  }

  console.log(`Nano Banana task created: ${result.data.taskId}`);
  return await pollForResult(result.data.taskId);
}


function createDramaticArtistPortraitSVG(bandData: BandData, artStyle: string, cardTheme: string = "dark"): string {
  const colors = generateColorPalette(bandData, cardTheme);
  const members = bandData.members.slice(0, 4);
  const isElectronic = bandData.genre.toLowerCase().includes('electronic');
  const isSolo = members.length === 1;
  
  // Apply art style and theme modifications
  const getStyleColors = (baseColors: any) => {
    let styleColors = { ...baseColors };
    
    // Apply theme modifications
    if (cardTheme === "vibrant") {
      styleColors.highlight = "#ff00ff"; // Bright magenta
      styleColors.background = "#ff1493"; // Deep pink background
      styleColors.textPrimary = "#00ffff"; // Cyan text
    } else if (cardTheme === "light") {
      styleColors.highlight = "#4169e1"; // Royal blue
      styleColors.background = "#f0f8ff"; // Alice blue
      styleColors.textPrimary = "#191970"; // Midnight blue
    }
    
    // Apply art style modifications
    if (artStyle === "retro") {
      styleColors.highlight = "#ff6347"; // Tomato red
      styleColors.background = "#2f4f4f"; // Dark slate gray
      styleColors.textPrimary = "#ffd700"; // Gold
    } else if (artStyle === "abstract" || artStyle === "geometric" || artStyle.toLowerCase().includes("abstract") || artStyle.toLowerCase().includes("geometric")) {
      styleColors.highlight = "#00ffff"; // Bright cyan
      styleColors.background = "#4a0e4e"; // Deep purple
      styleColors.textPrimary = "#ff1493"; // Hot pink
    }
    
    return styleColors;
  };
  
  const styledColors = getStyleColors(colors);
  
  // Dramatic composition positioning
  const memberPositions = isSolo ? 
    { 1: [[200, 160]] } : 
    {
      2: [[150, 160], [250, 160]], 
      3: [[130, 160], [200, 140], [270, 160]],
      4: [[120, 140], [180, 140], [220, 140], [280, 140]]
    };
  
  const positions = memberPositions[members.length as keyof typeof memberPositions] || [[200, 160]];
  
  // Add special effects for different art styles
  const isAbstractGeometric = artStyle === "abstract" || artStyle === "geometric" || artStyle.toLowerCase().includes("abstract") || artStyle.toLowerCase().includes("geometric");
  
  const styleEffects = artStyle === "retro" ? `
    <defs>
      <pattern id="noise" patternUnits="userSpaceOnUse" width="4" height="4">
        <rect width="4" height="4" fill="${styledColors.background}"/>
        <circle cx="1" cy="1" r="0.5" fill="${styledColors.highlight}" opacity="0.3"/>
        <circle cx="3" cy="3" r="0.5" fill="${styledColors.highlight}" opacity="0.2"/>
      </pattern>
      <filter id="vintage">
        <feColorMatrix values="1.2 0 0 0 0  0 0.8 0 0 0  0 0 0.6 0 0  0 0 0 1 0"/>
      </filter>
    </defs>
    <rect width="300" height="400" fill="url(#noise)" opacity="0.1"/>
  ` : isAbstractGeometric ? `
    <defs>
      <pattern id="geometric" patternUnits="userSpaceOnUse" width="40" height="40">
        <rect width="40" height="40" fill="${styledColors.background}"/>
        <polygon points="0,0 20,0 20,20" fill="${styledColors.highlight}" opacity="0.3"/>
        <polygon points="20,20 40,20 40,40" fill="${styledColors.textPrimary}" opacity="0.2"/>
        <circle cx="10" cy="30" r="5" fill="${styledColors.highlight}" opacity="0.4"/>
        <rect x="25" y="5" width="10" height="10" fill="${styledColors.textPrimary}" opacity="0.3" transform="rotate(45 30 10)"/>
      </pattern>
      <filter id="geometric-glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="300" height="400" fill="url(#geometric)" opacity="0.2"/>
  ` : "";

  return `<svg width="300" height="400" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${styledColors.background};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#000000;stop-opacity:0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      ${artStyle === "retro" ? `
        <pattern id="noise" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="${styledColors.background}"/>
          <circle cx="1" cy="1" r="0.5" fill="${styledColors.highlight}" opacity="0.3"/>
          <circle cx="3" cy="3" r="0.5" fill="${styledColors.highlight}" opacity="0.2"/>
        </pattern>
        <filter id="vintage">
          <feColorMatrix values="1.2 0 0 0 0  0 0.8 0 0 0  0 0 0.6 0 0  0 0 0 1 0"/>
        </filter>
      ` : isAbstractGeometric ? `
        <pattern id="geometric" patternUnits="userSpaceOnUse" width="40" height="40">
          <rect width="40" height="40" fill="${styledColors.background}"/>
          <polygon points="0,0 20,0 20,20" fill="${styledColors.highlight}" opacity="0.3"/>
          <polygon points="20,20 40,20 40,40" fill="${styledColors.textPrimary}" opacity="0.2"/>
          <circle cx="10" cy="30" r="5" fill="${styledColors.highlight}" opacity="0.4"/>
          <rect x="25" y="5" width="10" height="10" fill="${styledColors.textPrimary}" opacity="0.3" transform="rotate(45 30 10)"/>
        </pattern>
        <filter id="geometric-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      ` : ""}
    </defs>
    
    <rect width="300" height="400" fill="url(#bg)"/>
    ${artStyle === "retro" ? `<rect width="300" height="400" fill="url(#noise)" opacity="0.1"/>` : isAbstractGeometric ? `<rect width="300" height="400" fill="url(#geometric)" opacity="0.2"/>` : ""}
    
    <!-- Dramatic lighting effects -->
    ${isSolo ? `
      <ellipse cx="200" cy="120" rx="80" ry="120" fill="${styledColors.highlight}" opacity="${cardTheme === 'vibrant' ? '0.3' : '0.1'}"/>
      <ellipse cx="200" cy="160" rx="60" ry="80" fill="${styledColors.textPrimary}" opacity="0.05"/>
    ` : `
      <ellipse cx="150" cy="200" rx="120" ry="80" fill="url(#bg)" opacity="0.7"/>
    `}
    
    <!-- Band Members -->
    <g filter="url(#glow)">
      ${members.map((member, index) => {
        const [x, y] = positions[index] || [200, 160];
        const scale = isSolo ? 1.5 : (index === 0 ? 1.2 : 0.8); // Solo artist larger, lead member prominent
        
        if (isAbstractGeometric) {
          // Abstract geometric representation of band members
          const shapes = [
            `<polygon points="${x-20*scale},${y-15*scale} ${x+20*scale},${y-5*scale} ${x},${y+25*scale}" fill="${styledColors.textPrimary}" opacity="0.8" filter="url(#geometric-glow)"/>`,
            `<rect x="${x-15*scale}" y="${y-15*scale}" width="${30*scale}" height="${30*scale}" fill="${styledColors.highlight}" opacity="0.7" transform="rotate(45 ${x} ${y})" filter="url(#geometric-glow)"/>`,
            `<circle cx="${x}" cy="${y}" r="${20*scale}" fill="${styledColors.textPrimary}" opacity="0.8" filter="url(#geometric-glow)"/>`,
            `<polygon points="${x-15*scale},${y+20*scale} ${x+15*scale},${y+20*scale} ${x},${y-25*scale}" fill="${styledColors.highlight}" opacity="0.7" filter="url(#geometric-glow)"/>`
          ];
          return shapes[index % shapes.length];
        } else {
          return `
            <g transform="translate(${x}, ${y}) scale(${scale})" ${artStyle === "retro" ? 'filter="url(#vintage)"' : ''}>
              <circle cx="0" cy="0" r="25" fill="${styledColors.highlight}" opacity="${cardTheme === 'vibrant' ? '0.6' : '0.3'}"/>
              <circle cx="0" cy="-8" r="12" fill="${styledColors.textPrimary}" opacity="0.9"/>
              <rect x="-8" y="2" width="16" height="20" rx="3" fill="${styledColors.textPrimary}" opacity="0.7"/>
              ${member.role.toLowerCase().includes('vocal') ? `
                <line x1="12" y1="-5" x2="18" y2="-8" stroke="${styledColors.highlight}" stroke-width="2"/>
                <circle cx="18" cy="-8" r="2" fill="${styledColors.highlight}"/>
              ` : ''}
            </g>
          `;
        }
      }).join('')}
    </g>
    
    <!-- Band Name -->
    <text x="150" y="320" font-family="Arial Black, sans-serif" font-size="20" font-weight="bold"
          text-anchor="middle" fill="${colors.textPrimary}">
      ${escapeXml(bandData.bandName)}
    </text>

    <!-- Genre -->
    <text x="150" y="340" font-family="Arial, sans-serif" font-size="12"
          text-anchor="middle" fill="${colors.highlight}">
      ${escapeXml(bandData.genre)}
    </text>

    <!-- Philosophy -->
    <text x="150" y="360" font-family="Arial, sans-serif" font-size="10" font-style="italic"
          text-anchor="middle" fill="${colors.textPrimary}" opacity="0.8">
      "${escapeXml(bandData.philosophy?.substring(0, 50) || '')}"
    </text>

  </svg>`;
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Professional band photo shoot generation with Gemini's image generation
export async function generateBandPortrait(bandData: BandData, artStyle: string = "realistic", cardTheme: string = "dark"): Promise<string> {
  console.log('Generating professional band photo shoot for:', bandData.bandName);
  
  // Theme-based lighting and mood
  const themeDescriptor = cardTheme === "light" ? "bright, natural lighting with vibrant colors" : 
                         cardTheme === "vibrant" ? "dramatic colorful lighting with electric atmosphere" : 
                         "moody atmospheric lighting with deep shadows";
  
  // Art style variations with specific visual descriptions
  const stylePrompt = artStyle === "realistic" ? "photorealistic professional band portrait" :
                     artStyle === "stylized" ? "stylized digital illustration portrait" :
                     artStyle === "retro" ? "retro poster art style portrait with vintage film grain, bold saturated colors, and 1980s aesthetic" :
                     "abstract geometric art interpretation";
  
  // Enhanced theme-based styling for vibrant themes
  const enhancedThemeDescriptor = cardTheme === "vibrant" ? 
    "dramatic neon lighting with electric purple, magenta, and cyan colors, high contrast, synthwave aesthetic" :
    themeDescriptor;
  
  // Create genre-specific dramatic compositions with enhanced styling
  let prompt = `${stylePrompt} of ${bandData.bandName}, a ${bandData.genre} band. ${enhancedThemeDescriptor}. High-quality ${artStyle} band photo with ${bandData.members.length} members. Professional music photography style.`;
  const memberCount = bandData.members.length;
  const genre = bandData.genre.toLowerCase();
 

  if (memberCount === 1) {
    // Solo artist - dramatic, artistic close-ups with enhanced styling
    if (genre.includes('electronic')) {
      prompt = `${stylePrompt} cinematic portrait of a solo electronic music producer in a dimly lit studio. Close-up shot focusing on their face, looking pensively down at their equipment. ${enhancedThemeDescriptor}. Synthesizer LED lights providing ambient glow. Professional music photography with artistic depth and mood. Shot on 85mm lens with shallow depth of field.`;
    } else {
      prompt = `${stylePrompt} artistic portrait of a solo ${genre} musician. Dramatic close-up composition with the artist looking down pensively. ${enhancedThemeDescriptor}. Strong directional lighting creating bold shadows across their face. Professional music industry photography aesthetic. Cinematic quality with artistic depth.`;
    }
  } else if (memberCount === 2) {
    prompt = `${stylePrompt} professional duo portrait of ${genre} artists. Creative composition showing musical chemistry between the two members. One member prominently featured in foreground, second member artistically positioned in background with subtle depth blur. ${enhancedThemeDescriptor}. Dramatic studio lighting with creative shadows. Professional music industry photography with artistic flair.`;
  } else if (memberCount === 3) {
    if (genre.includes('electronic')) {
      prompt = `${stylePrompt} cinematic portrait of a 3-member electronic music group emerging from a futuristic vehicle with gull-wing doors. Lead artist in sharp focus in foreground, two supporting members in artistic formation behind. The vehicle's doors create dramatic angular shadows and geometric lighting patterns. ${enhancedThemeDescriptor}. Cyberpunk aesthetic with neon highlights. Professional music photography.`;
    } else {
      prompt = `${stylePrompt} professional trio portrait of ${genre} band. Lead member prominently featured in foreground with sharp focus. Two supporting band members positioned behind in creative formation with artistic depth blur. ${enhancedThemeDescriptor}. Dramatic directional lighting creating visual depth and layers. Creative composition with professional music industry quality.`;
    }
  } else {
    prompt = `${stylePrompt} professional band portrait of ${memberCount}-member ${genre} band "${bandData.bandName}". Lead member prominently featured in foreground with supporting members arranged in creative formation behind. ${enhancedThemeDescriptor}. Dramatic studio lighting with multiple light sources creating depth and visual layers. Professional music industry photography with cinematic composition and artistic storytelling.`;
  }

  try {
    return await generateArtistImage(prompt);
  } catch (error: any) {
    console.error("Image generation failed:", error?.message || error);
    const fallbackSvg = createDramaticArtistPortraitSVG(bandData, artStyle, cardTheme);
    return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString("base64")}`;
  }
}

/**
 * Main image generation function using Seedream or Nano Banano
 */
export async function generateArtistImage(prompt: string, provider: "seedream" | "nano" = "seedream"): Promise<string> {
  if (provider === "seedream") {
    return await generateWithSeedream(prompt);
  } else if (provider === "nano") {
    return await generateWithNanoBanano(prompt);
  } else {
    throw new Error("Unsupported provider");
  }
}