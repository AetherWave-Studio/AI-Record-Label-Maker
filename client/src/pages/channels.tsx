import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, TrendingUp, Users, Clock } from "lucide-react";

const mockChannels = [
  {
    id: 1,
    name: "Lo-Fi Beats",
    description: "Chill vibes and relaxing instrumental music",
    listeners: 12500,
    category: "Music",
    trending: true,
  },
  {
    id: 2,
    name: "AI Art Showcase",
    description: "Latest AI-generated artwork and creative experiments",
    listeners: 8300,
    category: "Visual Art",
    trending: true,
  },
  {
    id: 3,
    name: "Creative Coding",
    description: "Generative art and creative programming",
    listeners: 5200,
    category: "Tech",
    trending: false,
  },
  {
    id: 4,
    name: "Synth Wave Station",
    description: "80s-inspired electronic music and nostalgia",
    listeners: 15800,
    category: "Music",
    trending: true,
  },
  {
    id: 5,
    name: "AI Music Lab",
    description: "Experimental AI-generated music compositions",
    listeners: 6700,
    category: "Music",
    trending: false,
  },
  {
    id: 6,
    name: "Digital Dreams",
    description: "Ambient soundscapes and ethereal audio experiences",
    listeners: 4100,
    category: "Music",
    trending: false,
  },
];

export default function ChannelsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Radio className="w-10 h-10" />
            Channels
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover creative content from the AetherWave community
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Trending Now</h2>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              Live
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockChannels.map((channel) => (
              <Card 
                key={channel.id} 
                className="hover-elevate cursor-pointer"
                data-testid={`channel-${channel.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{channel.name}</CardTitle>
                    {channel.trending && (
                      <Badge variant="default" className="gap-1">
                        <TrendingUp className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{channel.listeners.toLocaleString()} listeners</span>
                    </div>
                    <Badge variant="outline">{channel.category}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Live now</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
