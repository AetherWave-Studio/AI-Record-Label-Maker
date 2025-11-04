import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Music, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AudioAnalyzer from "./audio-analyzer";
import WaveformVisualizer from "./waveform-visualizer";
import { ArtistData, GenerationOptions } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";

interface UserBandPreferences {
  bandName: string;
  songName: string;
  genre: string;
  artistType: 'solo' | 'ensemble';
  customPhoto?: File;
}

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onAnalysisComplete: (analysis: any, artist: ArtistData, imageUrl?: string, cardId?: string) => void;
  isProcessing: boolean;
  uploadedFile: File | null;
  analysisData: any;
  generationOptions: GenerationOptions;
}

export default function FileUpload({ 
  onFileUpload, 
  onAnalysisComplete, 
  isProcessing, 
  uploadedFile,
  analysisData,
  generationOptions 
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userPreferences, setUserPreferences] = useState<UserBandPreferences>({
    bandName: '',
    songName: '',
    genre: '',
    artistType: 'ensemble'
  });
  const [customPhotoPreview, setCustomPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeAudioMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('Starting file upload:', file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('artStyle', generationOptions.artStyle);
      formData.append('cardTheme', generationOptions.cardTheme);
      
      // Add user preferences (all optional)
      if (userPreferences.bandName.trim()) formData.append('userBandName', userPreferences.bandName);
      if (userPreferences.songName.trim()) formData.append('songName', userPreferences.songName);
      if (userPreferences.genre) formData.append('userGenre', userPreferences.genre);
      if (userPreferences.artistType) formData.append('artistType', userPreferences.artistType);
      
      // Add custom photo if provided
      if (userPreferences.customPhoto) {
        formData.append('customPhoto', userPreferences.customPhoto);
      }
      
      console.log('FormData created, making API request with extended timeout...');
      
      const response = await apiRequest('POST', '/api/analyze-audio', formData, { timeout: 300000 }); // 5 minute timeout
      console.log('API response received:', response.status);
      
      const result = await response.json();
      console.log('Analysis result:', result);
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Success callback triggered:', data);
      onAnalysisComplete(data.analysis, data.artistData, data.imageUrl, data.cardId);
      toast({
        title: "Analysis Complete!",
        description: "Your artist identity has been generated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error callback triggered:', error);
      
      // Check if it's a subscription limit error
      if (error.message?.includes('SUBSCRIPTION_LIMIT_REACHED') || error.response?.status === 403) {
        const errorData = error.response?.data;
        if (errorData?.error === 'SUBSCRIPTION_LIMIT_REACHED') {
          toast({
            title: "Subscription Limit Reached",
            description: errorData.message,
            variant: "destructive",
            action: (
              <button 
                onClick={() => window.location.href = '/upgrade'}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-sm"
              >
                Upgrade Now
              </button>
            ),
          });
          return;
        }
      }
      
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type - MP3 only
    const validTypes = [
      'audio/mp3',
      'audio/mpeg', 
      'audio/mp4', // Some MP3 files have this type
      'audio/mpeg3',
      'audio/x-mpeg-3'
    ];
    
    const isValidType = validTypes.includes(file.type.toLowerCase()) || 
                       file.name.toLowerCase().endsWith('.mp3');
    
    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: `Please upload an MP3 file only. Detected type: ${file.type}`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (10MB max for MP3)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large", 
        description: "Please upload an MP3 file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    onFileUpload(file);
    analyzeAudioMutation.mutate(file);
  }, [onFileUpload, analyzeAudioMutation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    console.log('File dropped!', e.dataTransfer.files);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) {
      setDragOver(true);
    }
  }, [dragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) {
      setDragOver(true);
    }
  }, [dragOver]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Size limit 5MB for images
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image Too Large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setUserPreferences(prev => ({ ...prev, customPhoto: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const genreOptions = [
    'Electronic', 'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Folk',
    'Alternative', 'Metal', 'Country', 'Blues', 'Reggae',
    'Classical', 'R&B', 'Punk', 'Indie', 'World Music'
  ];

  // All fields are optional - users can upload unless processing
  const isReadyToUpload = !isProcessing && !analyzeAudioMutation.isPending;

  return (
    <div className="space-y-6">
      {/* User Band Customization Section */}
      <div className="bg-charcoal/60 rounded-xl p-6 border border-sky-glint/30">
        <h4 className="text-lg font-bold mb-4 text-sky-glint">✨ Customize Your Virtual Artist</h4>
        <p className="text-soft-gray mb-6 text-sm"><strong>Your Choice:</strong> Specify details below for full control, or leave blank to let our AI surprise you with creative decisions!</p>
        
        <div className="space-y-4">
          {/* Band Name */}
          <div>
            <Label htmlFor="band-name" className="text-white-smoke font-medium mb-2 block">
              Virtual Artist Name <span className="text-xs text-soft-gray/70 font-normal">(or let AI decide)</span>
            </Label>
            <Input
              id="band-name"
              value={userPreferences.bandName}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, bandName: e.target.value }))}
              placeholder="e.g., Midnight Echoes (optional)"
              className="bg-deep-slate border-soft-gray/30 text-white-smoke placeholder:text-soft-gray/60"
              data-testid="input-band-name"
            />
          </div>
          
          {/* Song Name */}
          <div>
            <Label htmlFor="song-name" className="text-white-smoke font-medium mb-2 block">
              Song Name <span className="text-xs text-soft-gray/70 font-normal">(or let AI decide)</span>
            </Label>
            <Input
              id="song-name"
              value={userPreferences.songName}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, songName: e.target.value }))}
              placeholder="e.g., Starlight Dreams (optional)"
              className="bg-deep-slate border-soft-gray/30 text-white-smoke placeholder:text-soft-gray/60"
              data-testid="input-song-name"
            />
          </div>
          
          {/* Genre */}
          <div>
            <Label htmlFor="genre" className="text-white-smoke font-medium mb-2 block">
              Genre <span className="text-xs text-soft-gray/70 font-normal">(or let AI decide)</span>
            </Label>
            <select
              id="genre"
              value={userPreferences.genre}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full bg-deep-slate border border-soft-gray/30 rounded-lg px-4 py-3 text-white-smoke focus:border-sky-glint focus:ring-2 focus:ring-sky-glint/20"
              data-testid="select-genre"
            >
              <option value="">Choose genre (optional)...</option>
              {genreOptions.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          {/* Artist Type */}
          <div>
            <Label className="text-white-smoke font-medium mb-3 block">
              Artist Type <span className="text-xs text-soft-gray/70 font-normal">(or let AI decide)</span>
            </Label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="solo"
                  checked={userPreferences.artistType === 'solo'}
                  onChange={(e) => setUserPreferences(prev => ({ ...prev, artistType: e.target.value as 'solo' | 'ensemble' }))}
                  className="text-sky-glint focus:ring-sky-glint"
                  data-testid="radio-solo"
                />
                <span className="text-white-smoke">Solo Artist</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="ensemble"
                  checked={userPreferences.artistType === 'ensemble'}
                  onChange={(e) => setUserPreferences(prev => ({ ...prev, artistType: e.target.value as 'solo' | 'ensemble' }))}
                  className="text-sky-glint focus:ring-sky-glint"
                  data-testid="radio-ensemble"
                />
                <span className="text-white-smoke">Ensemble/Group</span>
              </label>
            </div>
          </div>
          
          {/* Custom Photo Upload */}
          <div>
            <Label className="text-white-smoke font-medium mb-2 block">
              Custom Photo <span className="text-xs text-soft-gray/70 font-normal">(or let AI generate)</span>
            </Label>
            <div className="flex items-center gap-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                data-testid="input-photo"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
                className="border-soft-gray/30 text-white-smoke hover:border-sky-glint"
                data-testid="button-upload-photo"
              >
                <Camera className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              {customPhotoPreview && (
                <img 
                  src={customPhotoPreview} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-lg object-cover border border-sky-glint/30"
                />
              )}
            </div>
            <p className="text-xs text-soft-gray mt-1">Upload your own artist photo or let AI create one</p>
          </div>
          
        </div>
      </div>
      {/* File Upload Area - Drag & Drop Disabled for Beta */}
      <div 
        className={`upload-area border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          !isReadyToUpload 
            ? "border-soft-gray/20 bg-deep-slate/20 cursor-not-allowed opacity-50"
            : "border-soft-gray/40 hover:border-sky-glint/60 cursor-pointer bg-deep-slate/50"
        }`}
        onClick={isReadyToUpload && !isProcessing ? handleClick : undefined}
        data-testid="upload-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/mpeg,audio/mp4,audio/mpeg3,audio/x-mpeg-3,.mp3"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          data-testid="input-file"
          disabled={!isReadyToUpload}
        />
        <Music className={`text-6xl mb-4 mx-auto ${
          isReadyToUpload ? "text-sky-glint/60" : "text-soft-gray/40"
        }`} />
        <h4 className="text-xl font-semibold mb-2">
          Click to select your audio files
        </h4>
        <p className="text-soft-gray mb-6">
          Choose MP3 files • Processing may take 2-5 minutes
        </p>
        <button 
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            isReadyToUpload 
              ? "bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate hover:shadow-lg" 
              : "bg-soft-gray/20 text-soft-gray/60 cursor-not-allowed"
          }`}
          data-testid="button-choose-files"
          disabled={!isReadyToUpload}
        >
          Choose Files
        </button>
        <p className="text-sm text-soft-gray mt-4">Supports MP3 only • Max 10MB • AI processing takes 2-5 minutes</p>
      </div>

      {/* Processing Status */}
      {uploadedFile && (
        <div className="space-y-4">
          <div className="bg-deep-slate/80 rounded-lg p-4 border border-sky-glint/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium" data-testid="text-filename">{uploadedFile.name}</span>
              <span className="text-electric-blue" data-testid="text-progress">
                {isProcessing ? `${Math.round(analyzeAudioMutation.isPending ? 50 : 100)}%` : "100%"}
              </span>
            </div>
            <div className="w-full bg-soft-gray/20 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-sky-glint to-electric-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${isProcessing ? (analyzeAudioMutation.isPending ? 50 : 100) : 100}%` }}
              />
            </div>
            {analyzeAudioMutation.isPending && (
              <div className="text-sm text-soft-gray flex items-center">
                <div className="animate-spin w-3 h-3 border-2 border-sky-glint border-t-transparent rounded-full mr-2"></div>
                Analyzing audio and generating AI artist identity... This may take 2-5 minutes.
              </div>
            )}
          </div>
          
          {/* Audio Analyzer */}
          <AudioAnalyzer file={uploadedFile} isAnalyzing={isProcessing} />
          
          {/* Analysis Details */}
          {analysisData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-deep-slate/80 rounded-lg p-4 border border-sky-glint/30">
                <div className="text-sm text-soft-gray">Detected Genre</div>
                <div className="font-semibold text-sky-glint" data-testid="text-genre">
                  {analysisData.genre || "Unknown"}
                </div>
              </div>
              <div className="bg-deep-slate/80 rounded-lg p-4 border border-sky-glint/30">
                <div className="text-sm text-soft-gray">Tempo (BPM)</div>
                <div className="font-semibold text-electric-blue" data-testid="text-bpm">
                  {analysisData.tempo || "Unknown"}
                </div>
              </div>
              <div className="bg-deep-slate/80 rounded-lg p-4 border border-sky-glint/30">
                <div className="text-sm text-soft-gray">Key</div>
                <div className="font-semibold text-sky-glint" data-testid="text-key">
                  {analysisData.key || "Unknown"}
                </div>
              </div>
              <div className="bg-deep-slate/80 rounded-lg p-4 border border-sky-glint/30">
                <div className="text-sm text-soft-gray">Energy Level</div>
                <div className="font-semibold text-electric-blue" data-testid="text-energy">
                  {analysisData.energy || "Unknown"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
