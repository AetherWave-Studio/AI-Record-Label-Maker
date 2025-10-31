const audioAnalysis: AudioAnalysisInput = {
    fileName: "helena_dream_pop.mp3",
    duration: 180,
    genre: "Dream Pop",
    vocalRange: "high",
    fundamentalFreq: 245,
    femaleIndicator: 0.78,
    instrumentComplexity: "solo"
};
console.log(`Vocal Range: ${audioAnalysis.vocalRange} ${audioAnalysis.vocalRange === 'high' ? '(FEMALE VOCALS DETECTED - Create female-fronted artist)' : ''}`);
// Run OpenAI call
import { OpenAI } from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Create a female-fronted solo VA in Dream Pop style: A ghost-writer reborn, probing AI soul, with dreamy tone.` }],
    max_tokens: 500
});
console.log(response.choices[0].message.content);