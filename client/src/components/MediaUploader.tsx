import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image, Video, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MediaUploaderProps {
  artistCardId: string;
  onClose: () => void;
}

interface MediaUploadLimits {
  photos: number;
  videos: number;
}

interface MediaFile {
  id: string;
  mediaType: string;
  fileName: string;
  fileSize: number;
  mediaUrl: string;
  duration?: number;
  isProfileImage: boolean;
  createdAt: string;
}

export function MediaUploader({ artistCardId, onClose }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing media
  const { data: mediaFiles = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: [`/api/bands/${artistCardId}/media`],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, mediaType }: { file: File; mediaType: 'photo' | 'video' }) => {
      // Validate file
      if (mediaType === 'video' && file.type && !file.type.startsWith('video/')) {
        throw new Error('Please select a valid video file');
      }
      if (mediaType === 'photo' && file.type && !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Get upload URL
      const uploadResponse = await fetch(`/api/bands/${artistCardId}/media/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadURL } = await uploadResponse.json();

      // Upload file to object storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Get video duration if it's a video
      let duration = undefined;
      if (mediaType === 'video' && file.type?.startsWith('video/')) {
        duration = await getVideoDuration(file);
        if (duration > 5) {
          throw new Error('Videos must be 5 seconds or less');
        }
      }

      // Save metadata
      const metadataResponse = await fetch(`/api/bands/${artistCardId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType,
          fileName: file.name,
          fileSize: file.size,
          mediaUrl: new URL(uploadURL).pathname,
          duration,
          isProfileImage: false,
        }),
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to save media metadata');
      }

      return await metadataResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bands/${artistCardId}/media`] });
      toast({
        title: 'Upload successful!',
        description: 'Your media has been uploaded.',
      });
      setUploading(false);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploading(false);
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await fetch(`/api/bands/${artistCardId}/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete media');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bands/${artistCardId}/media`] });
      toast({
        title: 'Media deleted',
        description: 'The media file has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = async (file: File, mediaType: 'photo' | 'video') => {
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      await uploadMutation.mutateAsync({ file, mediaType });
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, mediaType: 'photo' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, mediaType);
    }
    // Reset input value so same file can be uploaded again
    event.target.value = '';
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error('Failed to get video duration'));
      video.src = URL.createObjectURL(file);
    });
  };

  const photoCount = mediaFiles.filter(m => m.mediaType === 'photo').length;
  const videoCount = mediaFiles.filter(m => m.mediaType === 'video').length;

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading media...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" data-testid="media-uploader">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Band Media Manager
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="close-media-uploader">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Photo Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <h3 className="font-semibold mb-2">Upload Photos</h3>
            <p className="text-sm text-gray-500 mb-4">
              {photoCount} photos uploaded
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'photo')}
              className="hidden"
              id="photo-upload"
              disabled={uploading}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={uploading}
              data-testid="upload-photo-button"
            >
              Choose Photo
            </Button>
          </div>

          {/* Video Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <h3 className="font-semibold mb-2">Upload Videos</h3>
            <p className="text-sm text-gray-500 mb-2">
              {videoCount} videos uploaded
            </p>
            <p className="text-xs text-amber-600 mb-4 flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Max 5 seconds
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, 'video')}
              className="hidden"
              id="video-upload"
              disabled={uploading}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('video-upload')?.click()}
              disabled={uploading}
              data-testid="upload-video-button"
            >
              Choose Video
            </Button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Media Gallery */}
        {mediaFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Uploaded Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mediaFiles.map((media) => (
                <div key={media.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {media.mediaType === 'photo' ? (
                      <img
                        src={`/api/media${media.mediaUrl}`}
                        alt={media.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={`/api/media${media.mediaUrl}`}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(media.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-media-${media.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {media.fileName}
                  </div>
                  {media.duration && (
                    <div className="text-xs text-gray-400">
                      {media.duration.toFixed(1)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}