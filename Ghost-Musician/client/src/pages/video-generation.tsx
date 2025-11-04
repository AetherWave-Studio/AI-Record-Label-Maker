import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Video, Image, Upload, FileText, Loader2, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import UserNavigation from "@/components/user-navigation";

interface CreditData {
  credits: number;
}

interface VideoResult {
  videoUrl: string;
  duration: number;
  creditsUsed: number;
}

export default function VideoGeneration() {
  const [mode, setMode] = useState<"text" | "image" | "upload">("text");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<"5s" | "9s">("5s");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch user credits
  const { data: creditData } = useQuery<CreditData>({
    queryKey: ["/api/credits"],
    enabled: isAuthenticated,
  });

  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/video/create-seamless-loop', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate video');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setVideoResult(data);
      toast({
        title: "Video Generated!",
        description: `Seamless loop created successfully. ${data.creditsUsed} credits used.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate video",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    if (!prompt && mode === "text") {
      toast({
        title: "Missing Prompt",
        description: "Please enter a description for your video",
        variant: "destructive",
      });
      return;
    }

    if (!imageFile && mode === "image") {
      toast({
        title: "Missing Image",
        description: "Please upload an image",
        variant: "destructive",
      });
      return;
    }

    if (!videoFile && mode === "upload") {
      toast({
        title: "Missing Video",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('duration', duration);
    formData.append('aspectRatio', aspectRatio);
    formData.append('mode', mode);

    if (mode === "image" && imageFile) {
      formData.append('image', imageFile);
    } else if (mode === "upload" && videoFile) {
      formData.append('video', videoFile);
    }

    generateVideoMutation.mutate(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const creditsNeeded = mode === "upload" 
    ? "2 credits/sec × video duration" 
    : duration === "5s" 
      ? "10 credits" 
      : "18 credits";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle data-testid="text-login-required">Login Required</CardTitle>
            <CardDescription>Please log in to generate videos.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="text-page-title">
            <Video className="inline-block mr-2 h-8 w-8 text-purple-400" />
            Seamless Loop Creator
          </h1>
          <p className="text-slate-400 text-lg">
            Generate perfect looping videos with AI-powered technology
          </p>
          {creditData && (
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-full">
              <span className="text-white font-semibold" data-testid="text-current-credits">
                {creditData.credits} Credits
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Loop</CardTitle>
              <CardDescription>Choose a generation mode and customize your video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" data-testid="tab-text">
                    <FileText className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="image" data-testid="tab-image">
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="upload" data-testid="tab-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Describe Your Video
                    </label>
                    <Textarea
                      placeholder="e.g., A tranquil ocean wave gently rolling..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      data-testid="input-text-prompt"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                      data-testid="input-image-file"
                    />
                    {imageFile && (
                      <p className="text-sm text-green-400 mt-2">✓ {imageFile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Motion Prompt
                    </label>
                    <Textarea
                      placeholder="Describe how the image should animate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      data-testid="input-image-prompt"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Upload Video
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                      data-testid="input-video-file"
                    />
                    {videoFile && (
                      <p className="text-sm text-green-400 mt-2">✓ {videoFile.name}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Settings (only for text and image modes) */}
              {mode !== "upload" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Duration
                    </label>
                    <Select value={duration} onValueChange={(v) => setDuration(v as typeof duration)}>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5s">5 seconds (10 credits)</SelectItem>
                        <SelectItem value="9s">9 seconds (18 credits)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Aspect Ratio
                    </label>
                    <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as typeof aspectRatio)}>
                      <SelectTrigger data-testid="select-aspect-ratio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Cost Display */}
              <div className="bg-slate-800 p-4 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Estimated Cost:</span>
                  <span className="text-yellow-400 font-semibold">{creditsNeeded}</span>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generateVideoMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-generate"
              >
                {generateVideoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate Loop
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Your generated video will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {videoResult ? (
                <div className="space-y-4">
                  <video
                    src={videoResult.videoUrl}
                    controls
                    loop
                    autoPlay
                    className="w-full rounded-md bg-black"
                    data-testid="video-preview"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(videoResult.videoUrl, '_blank')}
                      className="flex-1"
                      data-testid="button-download"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => setVideoResult(null)}
                      variant="outline"
                      data-testid="button-new"
                    >
                      Create New
                    </Button>
                  </div>
                  <div className="text-sm text-slate-400 text-center">
                    Duration: {videoResult.duration}s • Credits used: {videoResult.creditsUsed}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-slate-900 rounded-md flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No video generated yet</p>
                    <p className="text-sm mt-2">Fill in the details and click Generate Loop</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <h3 className="font-semibold text-white mb-2">Text-to-Loop</h3>
                <p className="text-sm text-slate-400">
                  Generate seamless loops from text descriptions using Luma Ray 2 Flash
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Image className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <h3 className="font-semibold text-white mb-2">Image-to-Loop</h3>
                <p className="text-sm text-slate-400">
                  Bring your images to life with AI-powered animation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <h3 className="font-semibold text-white mb-2">Upload-to-Loop</h3>
                <p className="text-sm text-slate-400">
                  Convert any video into a perfect seamless loop
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
