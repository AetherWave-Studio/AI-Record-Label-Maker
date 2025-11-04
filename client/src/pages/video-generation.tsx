import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Upload, Sparkles } from "lucide-react";

export default function VideoGenerationPage() {
  const [mode, setMode] = useState<"image-to-loop" | "upload-video" | "text-to-loop">("image-to-loop");
  const [duration, setDuration] = useState<"5" | "9">("5");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Video className="w-10 h-10" />
            Seamless Loop Creator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create perfect looping videos with AI
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image-to-loop" data-testid="tab-image-to-loop">
              <Sparkles className="w-4 h-4 mr-2" />
              Image to Loop
            </TabsTrigger>
            <TabsTrigger value="upload-video" data-testid="tab-upload-video">
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </TabsTrigger>
            <TabsTrigger value="text-to-loop" data-testid="tab-text-to-loop">
              <Sparkles className="w-4 h-4 mr-2" />
              Text to Loop
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image-to-loop" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Image to Loop (Luma Ray 2 Flash)</CardTitle>
                <CardDescription>
                  Upload an image and add a motion prompt to create a seamless looping video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload">Upload Image</Label>
                  <Input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*"
                    data-testid="input-image-upload"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motion-prompt">Motion Prompt</Label>
                  <Textarea
                    id="motion-prompt"
                    placeholder="Describe the motion you want (e.g., 'gentle waves lapping', 'leaves rustling in the wind')"
                    data-testid="input-motion-prompt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds (10 credits)</SelectItem>
                      <SelectItem value="9">9 seconds (18 credits)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" data-testid="button-generate-image-to-loop">
                  Generate Loop
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload-video" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Video (Fal.ai Seedance Lite)</CardTitle>
                <CardDescription>
                  Convert an existing video into a seamless loop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-upload">Upload Video</Label>
                  <Input 
                    id="video-upload" 
                    type="file" 
                    accept="video/*"
                    data-testid="input-video-upload"
                  />
                  <p className="text-sm text-muted-foreground">
                    Cost: 2 credits per second of video duration
                  </p>
                </div>

                <Button className="w-full" data-testid="button-generate-upload-video">
                  Convert to Loop
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text-to-loop" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Text to Loop (Luma Ray 2 Flash)</CardTitle>
                <CardDescription>
                  Generate a seamless looping video from a text prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-prompt">Video Prompt</Label>
                  <Textarea
                    id="text-prompt"
                    placeholder="Describe the video you want to create (e.g., 'A serene mountain landscape with clouds moving slowly')"
                    rows={4}
                    data-testid="input-text-prompt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration-text">Duration</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                    <SelectTrigger data-testid="select-duration-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds (10 credits)</SelectItem>
                      <SelectItem value="9">9 seconds (18 credits)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" data-testid="button-generate-text-to-loop">
                  Generate Loop
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
