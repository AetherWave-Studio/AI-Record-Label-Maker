import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

import { generateArtistImage } from './src/services/imageProvider.js';

async function test() {
  console.log("KIE_API_KEY set:", !!process.env.KIE_API_KEY);
  console.log("WEBSHARE_PROXY set:", !!process.env.WEBSHARE_PROXY);

  const prompt = "photorealistic professional duo portrait of electronic artists. Creative composition with moody atmospheric lighting.";

  // Test Seedream
  console.log("\n--- Testing Seedream ---\n");
  try {
    const imageUrl = await generateArtistImage(prompt, "seedream");
    console.log("Seedream Success!");
    console.log("Image URL:", imageUrl);
  } catch (error: any) {
    console.error("Seedream Error:", error.message);
  }

  // Test Nano Banano
  console.log("\n--- Testing Nano Banano ---\n");
  try {
    const imageUrl = await generateArtistImage(prompt, "nano");
    console.log("Nano Banano Success!");
    console.log("Image URL:", imageUrl);
  } catch (error: any) {
    console.error("Nano Banano Error:", error.message);
  }
}

test();
