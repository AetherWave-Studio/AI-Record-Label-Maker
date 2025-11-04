import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Music,
  Play,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Settings,
  Edit,
  Upload,
  Camera
} from "lucide-react";
import type { User as UserType, ArtistCard } from "@shared/schema";

interface UserStats {
  totalBands: number;
  totalReleases: number;
  totalStreams: number;
  totalFollowers: number;
  joinDate: string;
}

export function UserProfileNew() {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const isOwnProfile = currentUser?.id === userId;
  const queryClient = useQueryClient();

  // Profile upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile data
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user's artist cards (bands)
  const { data: userBands, isLoading: bandsLoading } = useQuery<ArtistCard[]>({
    queryKey: ["/api/bands"],
    enabled: !!userId && isOwnProfile, // Only fetch for own profile
  });

  const isLoading = userLoading || bandsLoading;

  // Handle profile image upload
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();

      // Update the user data with new image URL
      if (result.profileImageUrl) {
        // Invalidate the user query to refresh the data
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

        // Also update the local user data if it's the current user
        if (userId === currentUser?.id) {
          queryClient.setQueryData(['/api/auth/user'], (old: any) => ({
            ...old,
            profileImageUrl: result.profileImageUrl
          }));
        }
      }
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Debug: Log user data
  console.log("User profile data:", user);
  console.log("ProfileImageUrl:", user?.profileImageUrl);

  // Calculate user stats
  const userStats: UserStats = {
    totalBands: userBands?.length || 0,
    totalReleases: userBands?.reduce((sum, band) => {
      const bandData = band.artistData as any;
      return sum + (bandData?.releases?.length || 0);
    }, 0) || 0,
    totalStreams: userBands?.reduce((sum, band) => {
      const bandData = band.artistData as any;
      return sum + (bandData?.totalStreams || 0);
    }, 0) || 0,
    totalFollowers: userBands?.reduce((sum, band) => {
      const bandData = band.artistData as any;
      return sum + (bandData?.followers || 0);
    }, 0) || 1000, // Default for demo
    joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown",
  };

  // Get plan color
  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'mogul': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'producer': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'creator': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'studio': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-800 rounded-xl mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-48 bg-gray-800 rounded-xl"></div>
              <div className="h-48 bg-gray-800 rounded-xl"></div>
              <div className="h-48 bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
            <p className="text-gray-400 mb-6">
              This user profile doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            {isOwnProfile && (
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700 mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <CardContent className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-gray-800 bg-gray-700" key={user.profileImageUrl || 'default'}>
                   {user.profileImageUrl ? (
						<AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
					  ) : (
						<AvatarImage src="/assets/icon-set/profile-icon.png" alt={user.firstName || "User"} />
					  )}
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {user.firstName?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />

                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Change profile picture"
                  >
                    {isUploading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-white rounded-full" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {/* Upload error message */}
                {uploadError && (
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-white">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.email || "User"
                    }
                  </h1>
                  <Badge className={`${getPlanColor(user.subscriptionPlan)} text-white border-0`}>
                    {user.subscriptionPlan?.toUpperCase() || 'FREE'}
                  </Badge>
                  {isOwnProfile && (
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      Your Profile
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {userStats.joinDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {userStats.totalFollowers.toLocaleString()} Followers
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    {user.credits?.toLocaleString() || 0} Credits
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4 mx-auto">
                <Music className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{userStats.totalBands}</div>
              <div className="text-sm text-gray-400">Artists</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-4 mx-auto">
                <Play className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{userStats.totalReleases}</div>
              <div className="text-sm text-gray-400">Releases</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-full mb-4 mx-auto">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{userStats.totalStreams.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Streams</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-full mb-4 mx-auto">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{userStats.totalFollowers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Followers</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Artists */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="h-5 w-5 text-blue-500" />
              Recent Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBands && userBands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userBands.slice(0, 6).map((band) => {
                  const bandData = band.artistData as any;
                  return (
                    <Link key={band.id} href={`/ghost-musician/artist/${band.id}`}>
                      <Card className="bg-gray-700/50 border-gray-600 hover:bg-gray-700 transition-colors cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <Music className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                {bandData?.bandName || "Unknown Artist"}
                              </h3>
                              <p className="text-sm text-gray-400 truncate">
                                {bandData?.genre || "No genre"} • {bandData?.members?.length || 0} members
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No Artists Yet</h3>
                <p className="text-gray-400 mb-6">
                  {isOwnProfile
                    ? "Create your first artist to get started"
                    : "This user hasn't created any artists yet"}
                </p>
                {isOwnProfile && (
                  <Link href="/">
                    <Button>Create Your First Artist</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}