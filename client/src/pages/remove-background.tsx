import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Video mapping for each processing step
const processVideoMap = {
  step1: {
    title: 'Reading Metadata',
    desc: 'Analyzing video properties...',
    duration: 10, // 10 seconds
    videos: ['/Remove_Video_Background/assets/01.Reading Metadata.mp4', '/Remove_Video_Background/assets/02.Reading Metadata.mp4']
  },
  step2: {
    title: 'Extracting Frames',
    desc: 'Converting video to PNG files...',
    duration: 10, // 10 seconds
    videos: ['/Remove_Video_Background/assets/03.Extracting_Frames.mp4', '/Remove_Video_Background/assets/04.extracting Frames.mp4', '/Remove_Video_Background/assets/05.Extracting_Frames.mp4']
  },
  step3: {
    title: 'AI Background Removal',
    desc: 'Processing each Frame using AI pixel removal...',
    duration: 60, // 60 seconds
    videos: ['/Remove_Video_Background/assets/06.Removing_backgrounds from frames.mp4', '/Remove_Video_Background/assets/07.Removing_backgrounds from frames.mp4']
  },
  step4: {
    title: 'Stitching transparent PNGs back into video',
    desc: 'Creating output file...',
    videos: ['/Remove_Video_Background/assets/08.SavingframesasPNG.mp4', '/Remove_Video_Background/assets/09.SavingFramesasPNG.mp4', '/Remove_Video_Background/assets/10.EncodintheMOV.mp4', '/Remove_Video_Background/assets/11.EncodingtheMOV.mp4']
  },
  step5: {
    title: 'Finalizing',
    desc: 'Cleaning up temporary files...',
    videos: ['/Remove_Video_Background/assets/12.DeliveringtheMOV.mp4', '/Remove_Video_Background/assets/13.TheMOV is Clean.mp4', '/Remove_Video_Background/assets/15.GifDelivery-End.mp4']
  }
} as const;

type StepKey = keyof typeof processVideoMap;

export default function RemoveBackgroundPage() {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<"webm" | "mov" | "gif">("webm");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepKey, setCurrentStepKey] = useState<StepKey | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const [processCompleted, setProcessCompleted] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const processVideoRef = useRef<HTMLVideoElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Play next video in the current step
  const playNextVideoInStep = () => {
    if (!currentStepKey || !processVideoRef.current) return;

    const stepData = processVideoMap[currentStepKey];
    const nextIndex = (currentVideoIndex + 1) % stepData.videos.length;

    processVideoRef.current.src = stepData.videos[nextIndex];
    processVideoRef.current.load();
    processVideoRef.current.play().catch(e => console.error('Video play error:', e));

    setCurrentVideoIndex(nextIndex);
  };

  // Handle video end event
  useEffect(() => {
    const videoElement = processVideoRef.current;
    if (!videoElement) return;

    const handleVideoEnd = () => {
      playNextVideoInStep();
    };

    videoElement.addEventListener('ended', handleVideoEnd);
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentStepKey, currentVideoIndex]);

  // Play videos for a specific step
  const playProcessStep = (stepKey: StepKey) => {
    setCurrentStepKey(stepKey);
    setCurrentVideoIndex(0);

    if (processVideoRef.current) {
      const stepData = processVideoMap[stepKey];
      processVideoRef.current.src = stepData.videos[0];
      processVideoRef.current.load();
      processVideoRef.current.play().catch(e => console.error('Video play error:', e));
    }
  };

  // Start the timed video sequence
  const startVideoSequence = () => {
    // Clear any existing timer
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }

    // Start with Step 1
    playStepSequence('step1');
  };

  // Play videos for a specific step for the configured duration
  const playStepSequence = (stepKey: StepKey) => {
    setCurrentStepKey(stepKey);
    setCurrentVideoIndex(0);

    if (processVideoRef.current) {
      const stepData = processVideoMap[stepKey];
      processVideoRef.current.src = stepData.videos[0];
      processVideoRef.current.load();
      processVideoRef.current.play().catch(e => console.error('Video play error:', e));
    }

    // Update progress message
    const stepData = processVideoMap[stepKey];
    setProgressMessage(stepData.desc);

    // Handle step progression based on step type
    if (stepKey === 'step1') {
      // Step 1: 10 seconds
      stepTimerRef.current = setTimeout(() => {
        playStepSequence('step2');
      }, 10000);
    } else if (stepKey === 'step2') {
      // Step 2: 10 seconds
      stepTimerRef.current = setTimeout(() => {
        playStepSequence('step3');
      }, 10000);
    } else if (stepKey === 'step3') {
      // Step 3: 60 seconds
      stepTimerRef.current = setTimeout(() => {
        playStepSequence('step4');
      }, 60000);
    } else if (stepKey === 'step4') {
      // Step 4: Continue until process completes
      // Simulate progress during step 4
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue += 1;
        if (progressValue <= 90) {
          setProgressPercent(progressValue);
        } else {
          clearInterval(progressInterval);
        }
      }, 800); // Update every 800ms

      // Store interval ID for cleanup
      (window as any).step4ProgressInterval = progressInterval;
    } else if (stepKey === 'step5') {
      // Step 5: Play final 3 videos in sequence, then complete
      playFinalVideos();
    }
  };

  // Play the final 3 videos in sequence
  const playFinalVideos = () => {
    const finalStepData = processVideoMap.step5;
    let videoIndex = 0;

    const playNextFinalVideo = () => {
      if (videoIndex < finalStepData.videos.length && processVideoRef.current) {
        processVideoRef.current.src = finalStepData.videos[videoIndex];
        processVideoRef.current.load();
        processVideoRef.current.play().catch(e => console.error('Video play error:', e));

        setCurrentVideoIndex(videoIndex);
        videoIndex++;

        // Wait for video to finish before playing next
        if (processVideoRef.current) {
          processVideoRef.current.onended = playNextFinalVideo;
        }
      } else {
        // All final videos played, complete the process
        completeProcess();
      }
    };

    playNextFinalVideo();
  };

  // Complete the process and show results
  const completeProcess = () => {
    // Clear step 4 progress interval if running
    if ((window as any).step4ProgressInterval) {
      clearInterval((window as any).step4ProgressInterval);
      (window as any).step4ProgressInterval = null;
    }

    setIsProcessing(false);
    setProgressPercent(100);
    setProgressMessage('Processing complete! Your video is ready.');
  };

  // Connect to SSE for completion notification only
  const connectToProgress = (jobId: string) => {
    console.log(`Connecting to progress stream for job: ${jobId}`);

    const eventSource = new EventSource(`/api/video/remove-background/progress/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Progress update:', data);

        // Only care about completion signal
        if (data.step === 'step6' && !processCompleted) {
          setProcessCompleted(true);
          setProgressPercent(100);

          // If we're still in step 4, move to step 5
          if (currentStepKey === 'step4') {
            // Clear step 4 timer
            if (stepTimerRef.current) {
              clearTimeout(stepTimerRef.current);
            }
            // Move to final videos
            playStepSequence('step5');
          }
        }
      } catch (e) {
        console.error('Error parsing progress data:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  // Cleanup SSE connection and timers
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Video file too large (max 100MB)",
        variant: "destructive",
      });
      return;
    }

    setUploadedVideo(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const processVideo = async () => {
    if (!uploadedVideo) {
      toast({
        title: "Error",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing) {
      toast({
        title: "Already Processing",
        description: "Please wait for the current job to complete",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Initializing...");
    setProgressPercent(0);
    setProcessCompleted(false);

    // Start the video sequence immediately
    startVideoSequence();

    const formData = new FormData();
    formData.append("video", uploadedVideo);
    formData.append("format", selectedFormat);

    try {
      const response = await fetch("/api/video/remove-background", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process video");
      }

      const result = await response.json();

      // Connect to SSE stream for completion notification only
      if (result.jobId) {
        setJobId(result.jobId);
        connectToProgress(result.jobId);
      }

      // Set result URL for final delivery
      setResultUrl(result.processedUrl);

      toast({
        title: "Processing Started",
        description: "Your video is being processed...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process video",
        variant: "destructive",
      });
      setIsProcessing(false);
      // Clear any running timers
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }
  };

  
  const resetProcess = () => {
    setUploadedVideo(null);
    setPreviewUrl("");
    setResultUrl("");
    setCurrentStepKey(null);
    setProgressMessage("");
    setProgressPercent(null);
    setJobId("");
    setProcessCompleted(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    // Clear step 4 progress interval if running
    if ((window as any).step4ProgressInterval) {
      clearInterval((window as any).step4ProgressInterval);
      (window as any).step4ProgressInterval = null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            ✨ Remove Video Background
          </h1>
          <p className="text-muted-foreground">AI-powered background removal for transparent videos</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border rounded-lg p-6 bg-card">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  uploadedVideo ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-border hover:border-purple-500"
                }`}
                onClick={() => videoInputRef.current?.click()}
              >
                <div className="text-6xl mb-4">🎬</div>
                <div className="text-lg mb-2">
                  {uploadedVideo ? uploadedVideo.name : "Click to upload or drag and drop"}
                </div>
                <div className="text-sm text-muted-foreground">MP4, MOV, WebM (max 100MB)</div>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {previewUrl && (
                <video src={previewUrl} controls className="mt-4 w-full rounded-lg max-h-48" />
              )}
            </div>

            {/* Format Selection */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4">Output Format</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { format: "webm", name: "WebM", desc: "Optimized for web, smaller file size" },
                  { format: "mov", name: "MOV (ProRes)", desc: "High quality for video editing" },
                  { format: "gif", name: "GIF", desc: "Animated for social media & sharing" },
                ].map((option) => (
                  <div
                    key={option.format}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedFormat === option.format
                        ? "border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950"
                        : "border-border hover:border-purple-500"
                    }`}
                    onClick={() => setSelectedFormat(option.format as any)}
                  >
                    <div className="font-bold text-lg mb-1">{option.name}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Button */}
            <button
              className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={processVideo}
              disabled={!uploadedVideo || isProcessing}
            >
              {isProcessing ? "Processing..." : "Remove Background (20 credits)"}
            </button>

            {/* Info Section */}
            <div className="border rounded-lg p-6 bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700">
              <h3 className="font-bold mb-3 text-purple-600 dark:text-purple-400">💡 How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Upload your video (any format supported)
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  AI removes the background from every frame
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Choose WebM (web), MOV (editing), or GIF (sharing) format
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Download your transparent video/GIF
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  Use in websites, video editors, or social media
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Video Player / Preview / Results */}
          <div>
            {isProcessing ? (
              <div className="border rounded-lg bg-card min-h-[600px] flex items-center justify-center overflow-hidden relative">
                {currentStepKey ? (
                  <>
                    {/* Process Video Player */}
                    <video
                      ref={processVideoRef}
                      className="w-full h-full object-contain"
                      muted
                      loop={false}
                      autoPlay
                    />
                    {/* Video Overlay with Real-Time Progress */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md border border-border rounded-lg px-6 py-4 flex flex-col items-center gap-2 min-w-[300px]">
                      <div className="font-bold text-lg text-white">
                        {processVideoMap[currentStepKey].title}
                      </div>
                      <div className="text-sm text-gray-300 text-center">
                        {progressMessage || processVideoMap[currentStepKey].desc}
                      </div>
                      {progressPercent !== null && (
                        <div className="w-full mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{progressPercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-30">🎬</div>
                    <div className="text-xl text-muted-foreground">{progressMessage || "Initializing..."}</div>
                  </div>
                )}
              </div>
            ) : resultUrl ? (
              <div className="border rounded-lg p-8 bg-card">
                <h2 className="text-2xl font-bold mb-4">🎉 Background Removed!</h2>
                <div className="mb-6 rounded-lg overflow-hidden" style={{
                  background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}>
                  {selectedFormat === "gif" ? (
                    <img src={resultUrl} alt="Result" className="w-full" />
                  ) : (
                    <video src={resultUrl} controls className="w-full" />
                  )}
                </div>
                <div className="flex gap-4">
                  <a
                    href={resultUrl}
                    download={`transparent-${selectedFormat}-${Date.now()}.${selectedFormat}`}
                    className="flex-1 py-3 px-6 bg-purple-600 text-white font-semibold rounded-lg text-center hover:bg-purple-700 transition-colors"
                  >
                    ⬇️ Download
                  </a>
                  <button
                    onClick={resetProcess}
                    className="flex-1 py-3 px-6 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
                  >
                    🔄 Process Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg bg-card min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-30">🎬</div>
                  <div className="text-xl text-muted-foreground">Upload a video to begin</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
