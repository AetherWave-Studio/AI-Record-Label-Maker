export async function generateBandImage(band: EnhancedBandData): Promise<ImageResult> {
  const prompt = `
Create a cinematic band profile image for "${band.bandName}", a ${band.genre} group.
Their philosophy is: "${band.philosophy}" and their signature sound is "${band.signatureSound}".
They originated from: "${band.world_building.origin_story}" and rose to fame through: "${band.world_building.breakthrough_moment}".

The band has ${band.members.length} members: ${band.members.join(', ')}.
Their visual motif is "${band.visual_motif}", their stage presence is "${band.stage_presence}", and their mythic alignment is "${band.mythic_alignment}".

Visualize them in a surreal, emotionally resonant setting that reflects their sound and story.
Use dreamlike lighting, symbolic props, and a mythic atmosphere. The image should feel like a memory from a parallel universe.
`;

  const result = await callGeminiImageAPI({ prompt, size: '1024x1024', format: 'png' });
  return result;
}