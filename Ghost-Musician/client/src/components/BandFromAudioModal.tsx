import { useState, useRef } from "react";
import { X, Upload, Sparkles, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BandFromAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRES = [
  "Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "Classical",
  "R&B", "Country", "Metal", "Indie", "Alternative", "K-Pop", "Auto-Detect"
];

export function BandFromAudioModal({ isOpen, onClose }: BandFromAudioModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'generating'>('idle');
  
  // Form state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [songTitle, setSongTitle] = useState("");
  const [genrePreference, setGenrePreference] = useState("Auto-Detect");
  const [bandNameHint, setBandNameHint] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/wave'];
      const isValid = validTypes.includes(file.type) || file.name.match(/\.(mp3|wav)$/i);
      
      if (!isValid) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an MP3 or WAV file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 100MB for safety)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 100MB.",
          variant: "destructive",
        });
        return;
      }

      setAudioFile(file);
      if (!songTitle) {
        setSongTitle(file.name.replace(/\.(mp3|wav)$/i, ''));
      }
    }
  };

  const handleGenerate = async () => {
    if (!audioFile) {
      toast({
        title: "No Audio File",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setUploadProgress('uploading');

    try {
      // Step 1: Upload the audio file
      const formData = new FormData();
      formData.append('audio', audioFile);

      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload audio file');
      }

      const uploadData = await uploadResponse.json();
      const audioFileId = uploadData.id;

      // Step 2: Generate band with AI
      setUploadProgress('generating');
      
      const requestBody = {
        audioFileId,
        songTitle: songTitle.trim() || undefined,
        userPreferences: {
          genre: genrePreference !== "Auto-Detect" ? genrePreference : undefined,
          bandName: bandNameHint.trim() || undefined,
        },
      };

      const response = await apiRequest("POST", "/api/rpg/bands/from-audio", requestBody);
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "🎸 AI Band Created!",
          description: `${data.band.bandName} is ready! ${data.usedFreeBand ? '(Used free generation)' : `(Cost: 50 credits)`}`,
        });

        // Refresh band lists
        queryClient.invalidateQueries({ queryKey: ["/api/rpg/bands"] });
        queryClient.invalidateQueries({ queryKey: ["/api/rpg/all-bands"] });
        
        // Close modal and reset
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate band');
      }
    } catch (error: any) {
      console.error("Error generating AI band:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate band. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setUploadProgress('idle');
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setSongTitle("");
    setGenrePreference("Auto-Detect");
    setBandNameHint("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                AI Band Generator
              </h2>
              <p className="text-sm text-gray-400">
                Upload audio and let AI create your virtual band
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isGenerating}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Audio Upload */}
          <div className="space-y-2">
            <Label htmlFor="audio-file" className="text-white text-base font-semibold flex items-center gap-2">
              <Music className="h-4 w-4" />
              Audio File (MP3 or WAV)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="audio-file"
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav,.mp3,.wav"
                onChange={handleFileChange}
                disabled={isGenerating}
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="input-audio-file"
              />
              {audioFile && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Upload className="h-4 w-4" />
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>
            {audioFile && (
              <p className="text-xs text-gray-400">
                File: {audioFile.name}
              </p>
            )}
          </div>

          {/* Song Title */}
          <div className="space-y-2">
            <Label htmlFor="song-title" className="text-white text-base font-semibold">
              Song Title (Optional)
            </Label>
            <Input
              id="song-title"
              type="text"
              placeholder="Leave blank to use filename"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              disabled={isGenerating}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
              data-testid="input-song-title"
            />
          </div>

          {/* Genre Preference */}
          <div className="space-y-2">
            <Label htmlFor="genre-pref" className="text-white text-base font-semibold">
              Genre Preference (Optional)
            </Label>
            <select
              id="genre-pref"
              value={genrePreference}
              onChange={(e) => setGenrePreference(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2"
              data-testid="select-genre"
            >
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              AI will create a band matching this genre or auto-detect from the audio
            </p>
          </div>

          {/* Band Name Hint */}
          <div className="space-y-2">
            <Label htmlFor="band-name-hint" className="text-white text-base font-semibold">
              Band Name Hint (Optional)
            </Label>
            <Input
              id="band-name-hint"
              type="text"
              placeholder="e.g., 'Something with Thunder' - AI will create a name"
              value={bandNameHint}
              onChange={(e) => setBandNameHint(e.target.value)}
              disabled={isGenerating}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
              data-testid="input-band-name-hint"
            />
            <p className="text-xs text-gray-400">
              Give AI a hint about the band name style you'd like
            </p>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {uploadProgress === 'uploading' && 'Uploading audio file...'}
                    {uploadProgress === 'generating' && 'AI is creating your virtual band...'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {uploadProgress === 'generating' && 'Generating band name, members, philosophy, and trading card'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!isGenerating && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong className="text-purple-400">How it works:</strong> Upload your audio, and our AI will analyze the music to create a complete virtual band with unique members, backstory, and a beautiful trading card. First 3 bands are free!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!audioFile || isGenerating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
