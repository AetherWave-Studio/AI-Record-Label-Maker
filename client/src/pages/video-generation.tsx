import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Wand2, Upload, Download } from "lucide-react";

type VideoModel = 'seedance-lite' | 'seedance-pro' | 'veo3_fast' | 'sora2' | 'sora2_pro' | 'sora2_pro_hd';
type ImageMode = 'first-frame' | 'last-frame' | 'reference';
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

// Model-specific configurations
const MODEL_CONFIG = {
  sora2: {
    supportsAspectRatio: true,
    aspectRatios: ['16:9', '9:16'] as AspectRatio[],
    supportsResolution: false,
    durationOptions: [10, 15], // Fixed durations for SORA 2
    imageLabel: '- For style reference',
  },
  sora2_pro: {
    supportsAspectRatio: true,
    aspectRatios: ['16:9', '9:16'] as AspectRatio[],
    supportsResolution: false,
    durationOptions: [10, 15], // Fixed durations for SORA 2
    imageLabel: '- For style reference',
  },
  sora2_pro_hd: {
    supportsAspectRatio: true,
    aspectRatios: ['16:9', '9:16'] as AspectRatio[],
    supportsResolution: false,
    durationOptions: [10, 15], // Fixed durations for SORA 2
    imageLabel: '- For style reference',
  },
  veo3_fast: {
    supportsAspectRatio: true,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '21:9'] as AspectRatio[],
    supportsResolution: false,
    durationRange: { min: 5, max: 10, step: 1 }, // Slider for VEO 3
    imageLabel: '- First frame or reference',
  },
  'seedance-lite': {
    supportsAspectRatio: false,
    supportsResolution: true,
    resolutions: ['512p', '720p', '1080p', '4k'],
    durationRange: { min: 3, max: 10, step: 1 }, // Slider for Seedance
    imageLabel: '- First frame, reference, or first+last',
  },
  'seedance-pro': {
    supportsAspectRatio: false,
    supportsResolution: true,
    resolutions: ['512p', '720p', '1080p', '4k'],
    durationRange: { min: 3, max: 10, step: 1 }, // Slider for Seedance
    imageLabel: '- First frame, reference, or first+last',
  },
} as const;

interface VideoGenerationRequest {
  prompt: string;
  model: VideoModel;
  imageData?: string;
  imageUrl?: string;
  endImageUrl?: string;
  imageMode?: ImageMode;
  resolution?: string;
  duration?: number;
  aspectRatio?: AspectRatio;
  seed?: number;
}

export default function VideoGeneration() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<VideoModel>("sora2");
  const [imageMode, setImageMode] = useState<ImageMode>("first-frame");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState(10); // Default to 10s for SORA 2
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [endImagePreview, setEndImagePreview] = useState<string>("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [seed, setSeed] = useState<number | undefined>(undefined);

  // Get current model configuration
  const modelConfig = MODEL_CONFIG[model];
  const isSeedanceModel = model.startsWith('seedance');

  const videoMutation = useMutation({
    mutationFn: async (request: VideoGenerationRequest) => {
      const response = await fetch('/api/generate-video-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Video generation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedVideoUrl(data.videoUrl);
      toast({
        title: "Success!",
        description: `Video generated successfully with ${model}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEndImage = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEndImage) {
      setEndImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEndImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your video",
        variant: "destructive",
      });
      return;
    }

    const request: VideoGenerationRequest = {
      prompt,
      model,
      resolution: model.startsWith('seedance') ? resolution : undefined,
      duration,
      aspectRatio: model.startsWith('veo') || model.startsWith('sora') ? aspectRatio : undefined,
      imageMode,
      ...(imagePreview && { imageData: imagePreview }),
      ...(endImagePreview && { endImageUrl: endImagePreview }),
      ...(seed && { seed }),
    };

    videoMutation.mutate(request);
  };

  const isKIEModel = model.startsWith('veo') || model.startsWith('sora');
  const isSeedanceModel = model.startsWith('seedance');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          AI Video Generation
        </h1>
        <p className="text-muted-foreground mt-2">
          Create stunning videos with premium AI models: VEO 3, SORA 2, and Seedance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
              <CardDescription>Configure your video generation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select value={model} onValueChange={(value) => setModel(value as VideoModel)}>
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seedance-lite">Seedance Lite (Fast)</SelectItem>
                    <SelectItem value="seedance-pro">Seedance Pro (High Quality)</SelectItem>
                    <SelectItem value="veo3_fast">VEO 3 Fast (Premium)</SelectItem>
                    <SelectItem value="sora2">SORA 2 (Premium)</SelectItem>
                    <SelectItem value="sora2_pro">SORA 2 Pro (Premium)</SelectItem>
                    <SelectItem value="sora2_pro_hd">SORA 2 Pro HD (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Video Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the video you want to generate... e.g., 'A serene sunset over a calm ocean with gentle waves'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Duration - Dropdown for fixed options, Slider for ranges */}
              {'durationOptions' in modelConfig ? (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelConfig.durationOptions.map((dur) => (
                        <SelectItem key={dur} value={dur.toString()}>
                          {dur} seconds
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : 'durationRange' in modelConfig ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Duration</Label>
                    <span className="text-sm text-muted-foreground">{duration} seconds</span>
                  </div>
                  <Slider
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    min={modelConfig.durationRange.min}
                    max={modelConfig.durationRange.max}
                    step={modelConfig.durationRange.step}
                    className="w-full"
                  />
                </div>
              ) : null}

              {/* Aspect Ratio (model-dependent) */}
              {modelConfig.supportsAspectRatio && (
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as AspectRatio)}>
                    <SelectTrigger id="aspectRatio">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelConfig.aspectRatios.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio} {ratio === '16:9' ? '(Landscape)' : ratio === '9:16' ? '(Portrait)' : ratio === '1:1' ? '(Square)' : ratio === '4:3' ? '(Classic)' : '(Ultrawide)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Resolution (for Seedance) */}
              {modelConfig.supportsResolution && (
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger id="resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelConfig.resolutions?.map((res) => (
                        <SelectItem key={res} value={res}>
                          {res} {res === '512p' ? '(Fast)' : res === '720p' ? '(Balanced)' : res === '1080p' ? '(High Quality)' : '(Ultra HD)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Image Upload - Dynamic based on model */}
              <div className="space-y-2">
                <Label htmlFor="image-upload">
                  Upload Image (Optional)
                  <span className="text-sm text-muted-foreground ml-2">
                    {modelConfig.imageLabel}
                  </span>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImageMode(model.startsWith('sora') ? 'reference' : 'first-frame');
                    handleImageUpload(e);
                  }}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                )}

                {/* Additional image for Seedance first+last mode */}
                {isSeedanceModel && imagePreview && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="end-image-upload" className="text-sm">
                      Add End Frame (Optional)
                      <span className="text-muted-foreground ml-2">- For smoother transitions</span>
                    </Label>
                    <Input
                      id="end-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                    />
                    {endImagePreview && (
                      <img src={endImagePreview} alt="End frame" className="w-full h-32 object-cover rounded-lg" />
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <h3 className="font-semibold">Advanced Options</h3>

                <div className="space-y-2">
                  <Label htmlFor="seed">Seed (Optional)</Label>
                  <Input
                    id="seed"
                    type="number"
                    placeholder="Leave empty for random"
                    value={seed || ''}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <p className="text-xs text-muted-foreground">Use the same seed to reproduce results</p>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={videoMutation.isPending || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {videoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Output */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Your generated video will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {videoMutation.isPending && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                  <Progress value={45} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    Generating your video... This may take a few minutes
                  </p>
                </div>
              )}

              {generatedVideoUrl && !videoMutation.isPending && (
                <div className="space-y-4">
                  <video
                    src={generatedVideoUrl}
                    controls
                    className="w-full rounded-lg"
                    autoPlay
                    loop
                  />
                  <Button
                    onClick={() => window.open(generatedVideoUrl, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                </div>
              )}

              {!generatedVideoUrl && !videoMutation.isPending && (
                <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No video generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {model === 'seedance-lite' && (
                <>
                  <p><strong>Provider:</strong> Fal.ai</p>
                  <p><strong>Quality:</strong> Fast, lower quality</p>
                  <p><strong>Best for:</strong> Quick previews</p>
                </>
              )}
              {model === 'seedance-pro' && (
                <>
                  <p><strong>Provider:</strong> Fal.ai</p>
                  <p><strong>Quality:</strong> High quality</p>
                  <p><strong>Best for:</strong> Production videos</p>
                </>
              )}
              {model === 'veo3_fast' && (
                <>
                  <p><strong>Provider:</strong> KIE.ai (Google VEO 3)</p>
                  <p><strong>Quality:</strong> Premium</p>
                  <p><strong>Best for:</strong> Cinematic videos</p>
                </>
              )}
              {model.startsWith('sora2') && (
                <>
                  <p><strong>Provider:</strong> KIE.ai (OpenAI SORA 2)</p>
                  <p><strong>Quality:</strong> {model.includes('hd') ? 'Ultra HD' : 'Premium'}</p>
                  <p><strong>Best for:</strong> Professional content</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
