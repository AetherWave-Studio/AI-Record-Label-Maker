import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Settings2, Crown, Star } from "lucide-react";

interface AdvancedArtistControlsProps {
  user: any;
  onParametersChange: (params: any) => void;
  artStyle: string;
  cardTheme: string;
  onArtStyleChange: (style: string) => void;
  onCardThemeChange: (theme: string) => void;
}

export default function AdvancedArtistControls({
  user,
  onParametersChange,
  artStyle,
  cardTheme,
  onArtStyleChange,
  onCardThemeChange
}: AdvancedArtistControlsProps) {
  const [customBandName, setCustomBandName] = useState("");
  const [customPhilosophy, setCustomPhilosophy] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [customInfluences, setCustomInfluences] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const userLevel = user?.user?.level || "Fan";
  const canCustomizeStyle = user?.user?.canCustomizeArtistStyle || false;
  const canSetPhilosophy = user?.user?.canSetArtistPhilosophy || false;
  const canUploadImages = user?.user?.canUploadProfileImages || false;
  const canHardcode = user?.user?.canHardcodeParameters || false;

  const experienceThresholds = {
    "Fan": { next: "Artist", xp: 100 },
    "Artist": { next: "Producer", xp: 500 },
    "Producer": { next: "A&R", xp: 2000 },
    "A&R": { next: "Label Executive", xp: 5000 },
    "Label Executive": { next: "Music Mogul", xp: 10000 }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      onParametersChange({ customImage: file });
    }
  };

  const handleParametersSubmit = () => {
    const params = {
      customBandName: customBandName || undefined,
      customPhilosophy: customPhilosophy || undefined,
      customGenre: customGenre || undefined,
      customInfluences: customInfluences.split(',').map(s => s.trim()).filter(Boolean),
      customImage: uploadedImage
    };
    onParametersChange(params);
  };

  return (
    <div className="bg-charcoal/60 rounded-xl p-6 space-y-6">
      {/* User Level Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {userLevel === "Label Executive" && <Crown className="w-5 h-5 text-amber-400" />}
            {userLevel === "A&R" && <Star className="w-5 h-5 text-purple-400" />}
            {userLevel === "Producer" && <Settings2 className="w-5 h-5 text-blue-400" />}
            <Badge variant="outline" className={`
              ${userLevel === "Label Executive" ? "text-amber-400 border-amber-400" : ""}
              ${userLevel === "A&R" ? "text-purple-400 border-purple-400" : ""}
              ${userLevel === "Producer" ? "text-blue-400 border-blue-400" : ""}
              ${userLevel === "Artist" ? "text-green-400 border-green-400" : ""}
              ${userLevel === "Fan" ? "text-soft-gray border-soft-gray" : ""}
            `}>
              {userLevel}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-soft-gray">Experience: {user?.user?.experience || 0}</p>
          {experienceThresholds[userLevel as keyof typeof experienceThresholds] && (
            <p className="text-xs text-sky-glint">
              Next: {experienceThresholds[userLevel as keyof typeof experienceThresholds].next} 
              ({experienceThresholds[userLevel as keyof typeof experienceThresholds].xp} XP)
            </p>
          )}
        </div>
      </div>

      {/* Creative Control Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white-smoke flex items-center space-x-2">
          <Settings2 className="w-5 h-5" />
          <span>Creative Control</span>
        </h3>

        {/* Basic Art Style (Always Available) */}
        <div className="space-y-2">
          <Label htmlFor="artStyle" className="text-white-smoke">Art Style</Label>
          <select
            id="artStyle"
            value={artStyle}
            onChange={(e) => onArtStyleChange(e.target.value)}
            className="w-full p-3 bg-deep-slate border border-soft-gray/30 rounded-lg text-white-smoke"
            data-testid="select-art-style"
          >
            <option value="realistic">Realistic Band Photo</option>
            <option value="stylized">Stylized Artistic</option>
            <option value="retro">Retro/Vintage</option>
            <option value="abstract">Abstract/Conceptual</option>
            
            {/* A&R+ Level Options */}
            {canCustomizeStyle && (
              <>
                <option value="grunge">Grunge Aesthetic</option>
                <option value="glamrock">Glam Rock</option>
                <option value="electronic">Electronic/Cyberpunk</option>
                <option value="indie">Indie Alternative</option>
                <option value="metal">Heavy Metal</option>
                <option value="jazz">Jazz Lounge</option>
                <option value="hiphop">Hip-Hop Street</option>
                <option value="country">Country/Folk</option>
              </>
            )}
          </select>
          {!canCustomizeStyle && (
            <p className="text-xs text-soft-gray">
              More art styles unlock at A&R level (2000 XP)
            </p>
          )}
        </div>

        {/* Card Theme */}
        <div className="space-y-2">
          <Label htmlFor="cardTheme" className="text-white-smoke">Card Theme</Label>
          <select
            id="cardTheme"
            value={cardTheme}
            onChange={(e) => onCardThemeChange(e.target.value)}
            className="w-full p-3 bg-deep-slate border border-soft-gray/30 rounded-lg text-white-smoke"
            data-testid="select-card-theme"
          >
            <option value="dark">Dark Mode</option>
            <option value="light">Light Mode</option>
            <option value="vibrant">Vibrant Colors</option>
            {canCustomizeStyle && (
              <>
                <option value="neon">Neon Glow</option>
                <option value="vintage">Vintage Sepia</option>
                <option value="minimalist">Minimalist</option>
                <option value="holographic">Holographic</option>
              </>
            )}
          </select>
        </div>

        {/* A&R Level - Custom Philosophy */}
        {canSetPhilosophy && (
          <div className="space-y-2">
            <Label htmlFor="customPhilosophy" className="text-white-smoke flex items-center space-x-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span>Band Philosophy/Motto</span>
            </Label>
            <Textarea
              id="customPhilosophy"
              placeholder="Define the band's core philosophy, artistic vision, or mission statement..."
              value={customPhilosophy}
              onChange={(e) => setCustomPhilosophy(e.target.value)}
              className="w-full p-3 bg-deep-slate border border-soft-gray/30 rounded-lg text-white-smoke"
              data-testid="input-custom-philosophy"
              rows={3}
            />
            <p className="text-xs text-purple-400">
              A&R Level: Shape the artistic direction and identity
            </p>
          </div>
        )}

        {/* Label Executive Level - Complete Control */}
        {canHardcode && (
          <div className="space-y-4 border-t border-amber-400/20 pt-4">
            <h4 className="text-amber-400 font-semibold flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Label Executive Controls</span>
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customBandName" className="text-white-smoke">Override Band Name</Label>
                <Input
                  id="customBandName"
                  placeholder="Force specific band name..."
                  value={customBandName}
                  onChange={(e) => setCustomBandName(e.target.value)}
                  className="bg-deep-slate border-amber-400/30 text-white-smoke"
                  data-testid="input-custom-band-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customGenre" className="text-white-smoke">Override Genre</Label>
                <Input
                  id="customGenre"
                  placeholder="Force specific genre classification..."
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  className="bg-deep-slate border-amber-400/30 text-white-smoke"
                  data-testid="input-custom-genre"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customInfluences" className="text-white-smoke">Override Influences</Label>
              <Input
                id="customInfluences"
                placeholder="Beatles, Radiohead, Pink Floyd (comma separated)"
                value={customInfluences}
                onChange={(e) => setCustomInfluences(e.target.value)}
                className="bg-deep-slate border-amber-400/30 text-white-smoke"
                data-testid="input-custom-influences"
              />
            </div>
          </div>
        )}

        {/* Label Executive Level - Custom Images */}
        {canUploadImages && (
          <div className="space-y-2">
            <Label htmlFor="customImage" className="text-white-smoke flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Upload Custom Band Photo</span>
            </Label>
            <div className="flex items-center space-x-4">
              <Input
                id="customImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-deep-slate border-amber-400/30 text-white-smoke"
                data-testid="input-custom-image"
              />
              {uploadedImage && (
                <Badge variant="outline" className="text-amber-400 border-amber-400">
                  Image Ready
                </Badge>
              )}
            </div>
            <p className="text-xs text-amber-400">
              Label Executive: Complete creative control - manufacture the perfect star
            </p>
          </div>
        )}

        {/* Apply Custom Parameters Button */}
        {(canSetPhilosophy || canHardcode) && (
          <Button
            onClick={handleParametersSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white"
            data-testid="button-apply-parameters"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Apply Creative Parameters
          </Button>
        )}
      </div>

      {/* Level Progression Info */}
      <div className="bg-deep-slate/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold text-sky-glint">Creative Control Progression</h4>
        <div className="space-y-1 text-xs text-soft-gray">
          <p><span className="text-green-400">Artist (100 XP):</span> Basic card generation</p>
          <p><span className="text-blue-400">Producer (500 XP):</span> Audio analysis, streaming benefits</p>
          <p><span className="text-purple-400">A&R (2000 XP):</span> Style customization, philosophy control</p>
          <p><span className="text-amber-400">Label Executive (5000 XP):</span> Complete creative control, image upload</p>
        </div>
      </div>
    </div>
  );
}