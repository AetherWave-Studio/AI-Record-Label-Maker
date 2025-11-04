import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Users, Music2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CreateBandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRES = [
  "Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "Classical",
  "R&B", "Country", "Metal", "Indie", "Alternative", "K-Pop"
];

const COLOR_PALETTES = [
  { name: "Neon Dreams", colors: ["#FF1493", "#00FFFF", "#9D00FF"] },
  { name: "Dark Matter", colors: ["#000000", "#1A1A1A", "#333333"] },
  { name: "Sunset Vibes", colors: ["#FF6B35", "#F7931E", "#FDC830"] },
  { name: "Ocean Deep", colors: ["#0077BE", "#00A8E8", "#00C9FF"] },
  { name: "Forest Glow", colors: ["#2D5016", "#6AB547", "#9ACD32"] },
];

export function CreateBandModal({ isOpen, onClose }: CreateBandModalProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [bandName, setBandName] = useState("");
  const [genre, setGenre] = useState("");
  const [concept, setConcept] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [influences, setInfluences] = useState("");
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [memberCount, setMemberCount] = useState(4);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when modal opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  console.log("🎨 CreateBandModal is OPEN and rendering");

  const handleCreate = async () => {
    console.log("🎸 Create Band clicked!", { bandName, genre });
    
    if (!bandName.trim() || !genre) {
      toast({
        title: "Missing Information",
        description: "Please provide a band name and select a genre.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    console.log("Creating band...");

    try {
      // Generate basic member data
      const members = Array.from({ length: memberCount }, (_, i) => ({
        role: i === 0 ? "Lead Vocals" : i === 1 ? "Guitar" : i === 2 ? "Bass" : i === 3 ? "Drums" : "Keyboard",
        name: `Member ${i + 1}`,
      }));

      const influencesList = influences
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const requestBody = {
        bandName: bandName.trim(),
        genre,
        concept: concept.trim() || undefined,
        philosophy: philosophy.trim() || undefined,
        influences: influencesList.length > 0 ? influencesList : undefined,
        colorPalette: COLOR_PALETTES[selectedPalette].colors,
        members: { bandMembers: members },
      };
      
      console.log("Sending request to /api/rpg/bands:", requestBody);

      const response = await apiRequest("POST", "/api/rpg/bands", requestBody);
      
      console.log("Response received:", response.status);

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "🎸 Band Created!",
          description: `${bandName} is ready to rock!`,
        });

        // Refresh band list
        queryClient.invalidateQueries({ queryKey: ["/api/bands"] });
        queryClient.invalidateQueries({ queryKey: ["/api/artist-cards"] });
        
        // Close modal and reset
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Creation Failed",
          description: error.error || "Failed to create band",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating band:", error);
      toast({
        title: "Error",
        description: "Failed to create band. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setBandName("");
    setGenre("");
    setConcept("");
    setPhilosophy("");
    setInfluences("");
    setSelectedPalette(0);
    setMemberCount(4);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        console.log("🔵 Backdrop clicked", e.target);
        if (e.target === e.currentTarget) {
          console.log("🔵 Click was on backdrop itself, closing modal");
          onClose();
        }
      }}
    >
      <div 
        className="bg-charcoal border border-sky-glint/30 rounded-2xl max-w-2xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)]"
        onClick={(e) => {
          console.log("🟢 Modal content clicked", e.target);
          e.stopPropagation();
        }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-sky-glint/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles size={32} className="text-sky-glint" />
            <h2 className="text-2xl font-bold text-white-smoke">Create New Band</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-soft-gray hover:text-white-smoke transition-colors"
            data-testid="button-close-modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div ref={scrollRef} className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
          {/* Band Name */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              <Music2 className="inline mr-2" size={16} />
              Band Name *
            </label>
            <Input
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Enter band name..."
              className="bg-deep-slate border-soft-gray/30 text-white-smoke"
              data-testid="input-band-name"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              Genre *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    console.log(`🎵 Genre selected: ${g}`);
                    setGenre(g);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    genre === g
                      ? "bg-sky-glint text-deep-slate"
                      : "bg-deep-slate border border-soft-gray/30 text-soft-gray hover:border-sky-glint hover:text-white-smoke"
                  }`}
                  data-testid={`button-genre-${g.toLowerCase()}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Concept */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              Band Concept (Optional)
            </label>
            <Textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="What makes this band unique?"
              className="bg-deep-slate border-soft-gray/30 text-white-smoke resize-none"
              rows={3}
              data-testid="textarea-concept"
            />
          </div>

          {/* Philosophy */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              Philosophy (Optional)
            </label>
            <Input
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              placeholder="Band's core belief or message..."
              className="bg-deep-slate border-soft-gray/30 text-white-smoke"
              data-testid="input-philosophy"
            />
          </div>

          {/* Influences */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              Influences (Optional)
            </label>
            <Input
              value={influences}
              onChange={(e) => setInfluences(e.target.value)}
              placeholder="Comma-separated: Beatles, Nirvana, ..."
              className="bg-deep-slate border-soft-gray/30 text-white-smoke"
              data-testid="input-influences"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              <Palette className="inline mr-2" size={16} />
              Color Palette
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_PALETTES.map((palette, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    console.log(`🎨 Palette ${idx} clicked!`);
                    setSelectedPalette(idx);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPalette === idx
                      ? "border-sky-glint"
                      : "border-soft-gray/30 hover:border-sky-glint/50"
                  }`}
                  data-testid={`button-palette-${idx}`}
                >
                  <div className="flex gap-1 mb-1">
                    {palette.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 h-8 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-soft-gray text-center">{palette.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Member Count */}
          <div>
            <label className="block text-sm font-medium text-white-smoke mb-2">
              <Users className="inline mr-2" size={16} />
              Number of Members: {memberCount}
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={memberCount}
              onChange={(e) => setMemberCount(Number(e.target.value))}
              className="w-full"
              data-testid="slider-member-count"
            />
          </div>
          </div>
        </div>

        {/* Actions - Fixed Footer */}
        <div className="flex gap-3 p-6 border-t border-sky-glint/20 flex-shrink-0">
          <Button
            type="button"
            onClick={() => {
              console.log("🚀 Button clicked! State:", { bandName, genre, isCreating });
              handleCreate();
            }}
            disabled={isCreating || !bandName.trim() || !genre}
            className="flex-1 bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate font-bold"
            data-testid="button-create-band"
          >
            {isCreating ? (
              <>Creating...</>
            ) : (
              <>
                <Sparkles className="mr-2" size={20} />
                Create Band
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="border-soft-gray/30 text-soft-gray hover:text-white-smoke"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
