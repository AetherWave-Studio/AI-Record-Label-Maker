// env.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Export all required env vars here
export const STRIPE_SECRET_KEY = getEnvVar("STRIPE_SECRET_KEY");
export const REPLIT_DOMAINS = getEnvVar("REPLIT_DOMAINS");
export const OPENAI_API_KEY = getEnvVar("OPENAI_API_KEY");
export const GEMINI_API_KEY = getEnvVar("GEMINI_API_KEY");
export const GOOGLE_API_KEY = getEnvVar("GOOGLE_API_KEY");
export const SESSION_SECRET = getEnvVar("SESSION_SECRET");