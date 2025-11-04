import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ArtistCard, ArtistData } from "@shared/schema";

interface BandEditFormProps {
  artistCard: ArtistCard;
  onComplete: () => void;
  onCancel: () => void;
}

const MUSIC_GENRES = [
  "Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "Classical", "Country", 
  "R&B", "Folk", "Blues", "Reggae", "Punk", "Metal", "Alternative", 
  "Indie", "Funk", "Soul", "Gospel", "Latin", "World", "Experimental"
];

const ARTIST_TYPES = [
  "Solo Artist", "Band", "Duo", "Trio", "Quartet", "Orchestra", "Choir", "DJ", "Producer"
];

export function BandEditForm({ artistCard, onComplete, onCancel }: BandEditFormProps) {
  const { toast } = useToast();
  const artistData = artistCard.artistData as ArtistData;
  
  // Form state
  const [formData, setFormData] = useState({
    bandName: artistData.bandName,
    genre: artistData.genre,
    artistType: (artistData as any).artistType || "Band",
    members: [...artistData.members],
    philosophy: artistData.philosophy,
    bandConcept: artistData.bandConcept,
    signatureSound: artistData.signatureSound,
    lyricalThemes: artistData.lyricalThemes,
    liveVisuals: artistData.liveVisuals,
    influences: artistData.influences.join(", "),
    sunoPrompt: artistData.sunoPrompt || ""
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      const payload = {
        ...updatedData,
        influences: updatedData.influences.split(",").map(inf => inf.trim()).filter(inf => inf.length > 0)
      };
      
      const response = await fetch(`/api/artist-cards/${artistCard.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update band information');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Band Info Updated",
        description: "Your band information has been successfully updated.",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update band information.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { name: "", role: "" }]
    });
  };

  const removeMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index)
    });
  };

  const updateMember = (index: number, field: "name" | "role", value: string) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData({
      ...formData,
      members: updatedMembers
    });
  };

  return (
    <div className="min-h-screen bg-background p-6" data-testid="band-edit-form">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Edit Band Information</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="cancel-edit-button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return
                </Button>
                <Button
                  type="submit"
                  form="band-edit-form"
                  disabled={updateMutation.isPending}
                  data-testid="save-band-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <form id="band-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bandName">Band/Artist Name</Label>
                  <Input
                    id="bandName"
                    value={formData.bandName}
                    onChange={(e) => setFormData({ ...formData, bandName: e.target.value })}
                    placeholder="Enter band name"
                    required
                    data-testid="input-band-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                    <SelectTrigger data-testid="select-genre">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSIC_GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="artistType">Artist Type</Label>
                <Select value={formData.artistType} onValueChange={(value) => setFormData({ ...formData, artistType: value })}>
                  <SelectTrigger data-testid="select-artist-type">
                    <SelectValue placeholder="Select artist type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTIST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Band Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Band Members
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  data-testid="add-member-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.members.map((member, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`member-name-${index}`}>Name</Label>
                    <Input
                      id={`member-name-${index}`}
                      value={member.name}
                      onChange={(e) => updateMember(index, "name", e.target.value)}
                      placeholder="Member name"
                      data-testid={`input-member-name-${index}`}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`member-role-${index}`}>Role</Label>
                    <Input
                      id={`member-role-${index}`}
                      value={member.role}
                      onChange={(e) => updateMember(index, "role", e.target.value)}
                      placeholder="Role/Instrument"
                      data-testid={`input-member-role-${index}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMember(index)}
                    data-testid={`remove-member-${index}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {formData.members.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No band members added. Click "Add Member" to get started.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Creative Details */}
          <Card>
            <CardHeader>
              <CardTitle>Creative Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="philosophy">Philosophy</Label>
                <Textarea
                  id="philosophy"
                  value={formData.philosophy}
                  onChange={(e) => setFormData({ ...formData, philosophy: e.target.value })}
                  placeholder="Band's artistic philosophy and mission"
                  rows={3}
                  data-testid="textarea-philosophy"
                />
              </div>

              <div>
                <Label htmlFor="bandConcept">Band Concept</Label>
                <Textarea
                  id="bandConcept"
                  value={formData.bandConcept}
                  onChange={(e) => setFormData({ ...formData, bandConcept: e.target.value })}
                  placeholder="Overall concept and vision of the band"
                  rows={3}
                  data-testid="textarea-band-concept"
                />
              </div>

              <div>
                <Label htmlFor="signatureSound">Signature Sound</Label>
                <Textarea
                  id="signatureSound"
                  value={formData.signatureSound}
                  onChange={(e) => setFormData({ ...formData, signatureSound: e.target.value })}
                  placeholder="Description of the band's unique sound and style"
                  rows={3}
                  data-testid="textarea-signature-sound"
                />
              </div>

              <div>
                <Label htmlFor="lyricalThemes">Lyrical Themes</Label>
                <Textarea
                  id="lyricalThemes"
                  value={formData.lyricalThemes}
                  onChange={(e) => setFormData({ ...formData, lyricalThemes: e.target.value })}
                  placeholder="Main themes and subjects in lyrics"
                  rows={3}
                  data-testid="textarea-lyrical-themes"
                />
              </div>

              <div>
                <Label htmlFor="liveVisuals">Live Performance Style</Label>
                <Textarea
                  id="liveVisuals"
                  value={formData.liveVisuals}
                  onChange={(e) => setFormData({ ...formData, liveVisuals: e.target.value })}
                  placeholder="Description of live performance style and visuals"
                  rows={3}
                  data-testid="textarea-live-visuals"
                />
              </div>

              <div>
                <Label htmlFor="influences">Musical Influences (comma-separated)</Label>
                <Input
                  id="influences"
                  value={formData.influences}
                  onChange={(e) => setFormData({ ...formData, influences: e.target.value })}
                  placeholder="Artist 1, Artist 2, Artist 3..."
                  data-testid="input-influences"
                />
              </div>

              <div>
                <Label htmlFor="sunoPrompt">Suno AI Music Generation Prompt</Label>
                <Textarea
                  id="sunoPrompt"
                  value={formData.sunoPrompt}
                  onChange={(e) => setFormData({ ...formData, sunoPrompt: e.target.value })}
                  placeholder="Detailed prompt for AI music generation in this artist's style"
                  rows={4}
                  data-testid="textarea-suno-prompt"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}