// Or if you're using Zod:
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export const TrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number(),
});