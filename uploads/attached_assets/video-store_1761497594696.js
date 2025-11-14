// Simple in-memory store for video job status
// In production, you'd use a database like Redis or Vercel KV

const videoJobs = new Map();

export function setVideoStatus(taskId, status) {
  videoJobs.set(taskId, {
    ...status,
    updatedAt: Date.now()
  });

  // Auto-cleanup after 1 hour
  setTimeout(() => {
    videoJobs.delete(taskId);
  }, 60 * 60 * 1000);
}

export function getVideoStatus(taskId) {
  return videoJobs.get(taskId) || null;
}

export function clearVideoStatus(taskId) {
  videoJobs.delete(taskId);
}
