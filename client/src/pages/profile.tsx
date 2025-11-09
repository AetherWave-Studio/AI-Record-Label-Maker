import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Edit3, Save, X, Crown, Calendar, Mail, Upload, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  vocalGenderPreference: string;
  profileImageUrl?: string;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    username: "",
    vocalGenderPreference: "m",
    profileImageUrl: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate if username can be changed (30-day restriction)
  const canChangeUsername = () => {
    if (!user?.lastUsernameChange) return true;
    const lastChange = new Date(user.lastUsernameChange);
    const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceChange >= 30;
  };

  const daysUntilUsernameChange = () => {
    if (!user?.lastUsernameChange) return 0;
    const lastChange = new Date(user.lastUsernameChange);
    const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysSinceChange);
  };

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        vocalGenderPreference: user.vocalGenderPreference || "m",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        vocalGenderPreference: user.vocalGenderPreference || "m",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/user/profile/image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      const data = await response.json();

      // Update local state and query cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Profile image updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Please Log In</h1>
        <p className="text-muted-foreground mb-8">
          You need to be logged in to view your profile.
        </p>
        <Button asChild>
          <a href="/api/dev/login">Log In</a>
        </Button>
      </div>
    );
  }

  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      free: "Fan",
      studio: "Studio Pass",
      creator: "Artist",
      producer: "Record Label",
      mogul: "Mogul",
    };
    return planNames[plan] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-slate-500",
      studio: "bg-blue-500",
      creator: "bg-purple-500",
      producer: "bg-pink-500",
      mogul: "bg-gradient-to-r from-yellow-400 to-orange-500",
    };
    return colors[plan] || "bg-slate-500";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="relative overflow-hidden">
          <div className={`absolute inset-0 opacity-10 ${getPlanColor(user.subscriptionPlan)}`} />
          <CardContent className="pt-6 relative">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-background">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {user.firstName?.[0]}{user.lastName?.[0] || user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <span className="animate-spin">⟳</span>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-3xl font-bold">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : user.username || "User"}
                  </h1>
                  <Badge className={`${getPlanColor(user.subscriptionPlan)} text-white gap-1`}>
                    <Crown className="w-3 h-3" />
                    {getPlanDisplayName(user.subscriptionPlan)}
                  </Badge>
                </div>

                {user.username && (
                  <p className="text-muted-foreground">@{user.username}</p>
                )}

                <div className="flex flex-col md:flex-row gap-4 pt-2 text-sm text-muted-foreground">
                  {user.email && (
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
                disabled={updateProfileMutation.isPending}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="stats">Stats & Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Update your personal information and preferences."
                    : "View your profile details."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          placeholder="Enter your first name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="username">Username</Label>
                        {!canChangeUsername() && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="w-3 h-3" />
                            {daysUntilUsernameChange()} days until next change
                          </Badge>
                        )}
                      </div>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        placeholder="Choose a username"
                        disabled={!canChangeUsername()}
                      />
                      {!canChangeUsername() && (
                        <p className="text-sm text-muted-foreground">
                          You can change your username once every 30 days. Your last change was{' '}
                          {new Date(user.lastUsernameChange!).toLocaleDateString()}.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vocalGenderPreference">
                        Vocal Gender Preference
                      </Label>
                      <Select
                        value={formData.vocalGenderPreference}
                        onValueChange={(value) =>
                          setFormData({ ...formData, vocalGenderPreference: value })
                        }
                      >
                        <SelectTrigger id="vocalGenderPreference">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m">Male</SelectItem>
                          <SelectItem value="f">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateProfileMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">First Name</Label>
                        <p className="text-lg">{user.firstName || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Last Name</Label>
                        <p className="text-lg">{user.lastName || "Not set"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Username</Label>
                      <p className="text-lg">{user.username || "Not set"}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-lg">{user.email}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Vocal Gender Preference
                      </Label>
                      <p className="text-lg">
                        {user.vocalGenderPreference === "m" ? "Male" : "Female"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Credits</CardTitle>
                  <CardDescription>Your current credit balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-yellow-500">
                    {user.credits}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Last reset: {new Date(user.lastCreditReset).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>Your current plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className={`${getPlanColor(user.subscriptionPlan)} text-white text-lg px-4 py-2`}>
                    {getPlanDisplayName(user.subscriptionPlan)}
                  </Badge>
                  {user.subscriptionPlan === "free" && (
                    <p className="text-sm text-muted-foreground mt-4">
                      <Button asChild variant="link" className="px-0">
                        <a href="/buy-credits">Upgrade to get more features</a>
                      </Button>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Welcome Bonus</CardTitle>
                  <CardDescription>One-time signup bonus</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">
                    {user.welcomeBonusClaimed === 1 ? (
                      <Badge variant="secondary">Claimed</Badge>
                    ) : (
                      <Badge variant="outline">Not claimed</Badge>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Age</CardTitle>
                  <CardDescription>Member since</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
