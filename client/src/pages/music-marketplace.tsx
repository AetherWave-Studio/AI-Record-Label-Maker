import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Heart, Share2, Search, Filter, Volume2, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  audioUrl: string;
  downloadUrl: string;
  tags: string[];
  price: number;
  license: "Standard" | "Extended" | "Exclusive";
  coverArt: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArt: string;
  tracks: Track[];
  genre?: string;
  mood?: string;
  totalDuration: number;
}

export default function MusicMarketplace() {
  const { isAuthenticated, user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Authentic AetherWave Studio Theme Packs
  const playlists: Playlist[] = [
    {
      id: "pixel-dust",
      name: "Pixel Dust",
      description: "Synthwave • Chiptune • Indie Electric",
      coverArt: "https://www.dropbox.com/scl/fi/s3xnfw4bd0t3t06dyjw58/pixel_dust_bg.jpg?rlkey=zb2ejcakzpk2bfr4dqie2j18i&st=d6mc1vqn&raw=1",
      genre: "Synthwave",
      mood: "Energetic",
      totalDuration: 3420,
      tracks: [
        {
          id: "track-1",
          title: "Neon Grid Runner",
          artist: "AetherWave Studio",
          duration: 240,
          genre: "Synthwave",
          mood: "Energetic",
          bpm: 128,
          key: "C# Minor",
          audioUrl: "/api/audio/neon-grid-runner.mp3",
          downloadUrl: "/api/download/neon-grid-runner.wav",
          tags: ["synthwave", "chiptune", "retro", "gaming"],
          price: 99,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        },
        {
          id: "track-2", 
          title: "8-Bit Dreams",
          artist: "AetherWave Studio",
          duration: 180,
          genre: "Chiptune",
          mood: "Nostalgic",
          bpm: 140,
          key: "F Major",
          audioUrl: "/api/audio/8bit-dreams.mp3",
          downloadUrl: "/api/download/8bit-dreams.wav",
          tags: ["chiptune", "indie", "electric", "nostalgic"],
          price: 99,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "voltage-bloom",
      name: "Voltage Bloom",
      description: "Electro Dream Pop • Psychedelic Synth • Future Bass",
      coverArt: "https://www.dropbox.com/scl/fi/2lvhy555h439hcf3s4o6y/voltage_bloom_bg.jpg?rlkey=hdufr6e20pa4r3nyicx5d0zut&st=moceb1sn&raw=1",
      genre: "Electronic",
      mood: "Dreamy",
      totalDuration: 2400,
      tracks: [
        {
          id: "track-3",
          title: "Electric Petals",
          artist: "AetherWave Studio",
          duration: 210,
          genre: "Electro Dream Pop",
          mood: "Dreamy",
          bpm: 115,
          key: "G Major",
          audioUrl: "/api/audio/electric-petals.mp3",
          downloadUrl: "/api/download/electric-petals.wav",
          tags: ["electro", "dreampop", "psychedelic", "future bass"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "blacklight-ritual",
      name: "Blacklight Ritual",
      description: "Occult Electronica • Dark Tribal • Witch House",
      coverArt: "https://www.dropbox.com/scl/fi/j5ic74i7wo1vdpxnchvsx/blacklight_ritual_bg.jpg?rlkey=3q5dz83v5jb2nn0abk130qnjq&st=mgs6ufhm&raw=1",
      genre: "Dark Electronic",
      mood: "Mysterious",
      totalDuration: 2700,
      tracks: [
        {
          id: "track-4",
          title: "Obsidian Chant",
          artist: "AetherWave Studio",
          duration: 240,
          genre: "Occult Electronica",
          mood: "Mysterious",
          bpm: 90,
          key: "D Minor",
          audioUrl: "/api/audio/obsidian-chant.mp3",
          downloadUrl: "/api/download/obsidian-chant.wav",
          tags: ["occult", "dark tribal", "witch house", "ritual"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "neon-pulse",
      name: "Neon Pulse",
      description: "Synthwave • Vaporwave • Retro Electro",
      coverArt: "https://www.dropbox.com/scl/fi/kddk867j8drzmic3swvzi/Neon_Pulse.jpg?rlkey=yvsym7bdwj4m94dnwgkdxw51m&st=g02763b0&raw=1",
      genre: "Synthwave",
      mood: "Retro",
      totalDuration: 2200,
      tracks: [
        {
          id: "track-5",
          title: "Cyber Highway",
          artist: "AetherWave Studio",
          duration: 220,
          genre: "Synthwave",
          mood: "Retro",
          bpm: 120,
          key: "A Minor",
          audioUrl: "/api/audio/cyber-highway.mp3",
          downloadUrl: "/api/download/cyber-highway.wav",
          tags: ["synthwave", "vaporwave", "retro", "cyberpunk"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "ghost-signal",
      name: "Ghost Signal",
      description: "Gothic • Darkwave • Cinematic Shadows",
      coverArt: "https://www.dropbox.com/scl/fi/48pnk40dynsnnmte5qimt/Ghost_Signal_bg.png?rlkey=mibzeaejgk7184oy6ain6v3ng&st=nmxctfaz&raw=1",
      genre: "Gothic",
      mood: "Dark",
      totalDuration: 2500,
      tracks: [
        {
          id: "track-6",
          title: "Phantom Transmission",
          artist: "AetherWave Studio",
          duration: 250,
          genre: "Gothic",
          mood: "Dark",
          bpm: 85,
          key: "B Minor",
          audioUrl: "/api/audio/phantom-transmission.mp3",
          downloadUrl: "/api/download/phantom-transmission.wav",
          tags: ["gothic", "darkwave", "cinematic", "shadows"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "trap-noire",
      name: "Trap Noire",
      description: "Trap + Dark Ambient • Moody Beats",
      coverArt: "https://www.dropbox.com/scl/fi/6vschke6sekuaiwm37i0p/Trap-Noire.jpg?rlkey=ukl7ruzvca1oa1g8rya9l0blk&st=58vwh0to&raw=1",
      genre: "Trap",
      mood: "Moody",
      totalDuration: 1900,
      tracks: [
        {
          id: "track-7",
          title: "Shadow Beat",
          artist: "AetherWave Studio",
          duration: 190,
          genre: "Trap",
          mood: "Moody",
          bpm: 140,
          key: "F# Minor",
          audioUrl: "/api/audio/shadow-beat.mp3",
          downloadUrl: "/api/download/shadow-beat.wav",
          tags: ["trap", "dark ambient", "moody", "urban"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "echo-chamber",
      name: "Echo Chamber",
      description: "Ambient Drones • Industrial Undercurrents",
      coverArt: "https://www.dropbox.com/scl/fi/mcu1hxb5jaezn1n1x3xfb/echo_chamber_bg.jpg?rlkey=d5b4qwvwcs272aixbd1t8ssox&st=utfz6c4w&raw=1",
      genre: "Ambient",
      mood: "Industrial",
      totalDuration: 3000,
      tracks: [
        {
          id: "track-8",
          title: "Void Resonance",
          artist: "AetherWave Studio",
          duration: 300,
          genre: "Ambient",
          mood: "Industrial",
          bpm: 60,
          key: "C Minor",
          audioUrl: "/api/audio/void-resonance.mp3",
          downloadUrl: "/api/download/void-resonance.wav",
          tags: ["ambient", "drones", "industrial", "atmospheric"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "glass-hearts",
      name: "Glass Hearts",
      description: "Alt‑Pop • Indie Electronica • Romantic Melancholy",
      coverArt: "https://www.dropbox.com/scl/fi/9nvcgqn8w3xso6ombr5ux/Glass_Hearts_bg.png?rlkey=hbbquhq8um8d9rz6k5nu5eznj&st=fhwjz7s8&raw=1",
      genre: "Alt-Pop",
      mood: "Melancholy",
      totalDuration: 2100,
      tracks: [
        {
          id: "track-9",
          title: "Fractured Love",
          artist: "AetherWave Studio",
          duration: 210,
          genre: "Alt-Pop",
          mood: "Melancholy",
          bpm: 95,
          key: "E Major",
          audioUrl: "/api/audio/fractured-love.mp3",
          downloadUrl: "/api/download/fractured-love.wav",
          tags: ["alt-pop", "indie electronica", "romantic", "melancholy"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    },
    {
      id: "midnight-loop",
      name: "Midnight Loop",
      description: "Chillhop • Lofi Study Vibes • Dreamy Grooves",
      coverArt: "https://www.dropbox.com/scl/fi/mrz5kf2z8jo299diijqch/Midnight-Loop-bg.jpeg?rlkey=aod5dx2q5v5z0usd5zwquinxt&st=o4wfsy7g&raw=1",
      genre: "Chillhop",
      mood: "Chill",
      totalDuration: 1800,
      tracks: [
        {
          id: "track-10",
          title: "Study Session",
          artist: "AetherWave Studio",
          duration: 180,
          genre: "Chillhop",
          mood: "Chill",
          bpm: 85,
          key: "F Major",
          audioUrl: "/api/audio/study-session.mp3",
          downloadUrl: "/api/download/study-session.wav",
          tags: ["chillhop", "lofi", "study", "dreamy"],
          price: 299,
          license: "Standard",
          coverArt: "/api/placeholder/400/400"
        }
      ]
    }
  ];

  const genres = ["All", "Synthwave", "Electronic", "Dark Electronic", "Gothic", "Trap", "Ambient", "Alt-Pop", "Chillhop"];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleDownload = (track: Track) => {
    if (!isAuthenticated) {
      alert("Please sign in to download tracks");
      return;
    }
    
    if (user?.level === "Fan") {
      alert("Upgrade to Artist level or higher to download tracks");
      return;
    }

    // Simulate download
    const link = document.createElement('a');
    link.href = track.downloadUrl;
    link.download = `${track.artist} - ${track.title}.wav`;
    link.click();
  };

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const filteredPlaylists = playlists.filter(playlist => {
    const matchesGenre = selectedGenre === "All" || playlist.genre === selectedGenre;
    const matchesSearch = playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         playlist.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-slate to-charcoal text-white-smoke">
      {/* Header */}
      <header className="bg-charcoal/90 backdrop-blur-sm border-b border-sky-glint/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Volume2 className="text-sky-glint text-2xl" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-glint to-electric-blue bg-clip-text text-transparent">
                AetherWave Music
              </h1>
              <Badge variant="outline" className="text-sky-glint border-sky-glint">
                Royalty-Free
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-soft-gray w-4 h-4" />
                <Input
                  placeholder="Search tracks, artists, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-deep-slate border-soft-gray/30 text-white-smoke"
                  data-testid="input-search"
                />
              </div>
              
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-deep-slate border border-soft-gray/30 rounded-lg px-4 py-2 text-white-smoke"
                data-testid="select-genre"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Playlists */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-6 text-white-smoke">Featured Playlists</h2>
            <div className="space-y-4">
              {filteredPlaylists.map(playlist => (
                <div
                  key={playlist.id}
                  onClick={() => window.location.href = `/playlist/${playlist.id}`}
                  className="p-4 rounded-xl cursor-pointer transition-all hover:bg-sky-glint/10 border bg-charcoal/40 border-soft-gray/20"
                  data-testid={`playlist-${playlist.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={playlist.coverArt} 
                      alt={playlist.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-white-smoke">{playlist.name}</h3>
                      <p className="text-sm text-soft-gray">{playlist.tracks.length} tracks</p>
                      <p className="text-xs text-soft-gray">{formatTime(playlist.totalDuration)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-soft-gray mt-2">{playlist.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {playlist.genre && (
                      <Badge variant="outline" className="text-xs">
                        {playlist.genre}
                      </Badge>
                    )}
                    {playlist.mood && (
                      <Badge variant="outline" className="text-xs">
                        {playlist.mood}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Track List */}
          <div className="lg:col-span-3">
            {selectedPlaylist ? (
              <div>
                {/* Playlist Header */}
                <div className="flex items-center space-x-6 mb-8 p-6 bg-gradient-to-r from-charcoal/60 to-deep-slate/60 rounded-xl">
                  <img 
                    src={selectedPlaylist.coverArt}
                    alt={selectedPlaylist.name}
                    className="w-48 h-48 rounded-xl object-cover shadow-2xl"
                  />
                  <div>
                    <h1 className="text-4xl font-bold text-white-smoke mb-2">{selectedPlaylist.name}</h1>
                    <p className="text-soft-gray mb-4">{selectedPlaylist.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-soft-gray">
                      <span>{selectedPlaylist.tracks.length} tracks</span>
                      <span>•</span>
                      <span>{formatTime(selectedPlaylist.totalDuration)}</span>
                      <span>•</span>
                      <span>AetherWave Studio</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Button className="bg-sky-glint hover:bg-sky-glint/80 text-deep-slate">
                        <Play className="w-4 h-4 mr-2" />
                        Play All
                      </Button>
                      <Button variant="outline" className="border-soft-gray/30">
                        <Shuffle className="w-4 h-4 mr-2" />
                        Shuffle
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Track List */}
                <div className="space-y-2">
                  {selectedPlaylist.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg hover:bg-charcoal/40 transition-colors ${
                        currentTrack?.id === track.id ? 'bg-sky-glint/10' : ''
                      }`}
                      data-testid={`track-${track.id}`}
                    >
                      <div className="w-8 text-center text-soft-gray">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <div className="w-4 h-4 bg-sky-glint rounded-full animate-pulse mx-auto"></div>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayPause(track)}
                        className="text-sky-glint hover:text-sky-glint/80"
                        data-testid={`button-play-${track.id}`}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      <img 
                        src={track.coverArt}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover"
                      />

                      <div className="flex-1">
                        <h3 className="font-medium text-white-smoke">{track.title}</h3>
                        <p className="text-sm text-soft-gray">{track.artist}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {track.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-sm text-soft-gray">
                        {track.bpm} BPM • {track.key}
                      </div>

                      <div className="text-sm text-soft-gray">
                        {formatTime(track.duration)}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-sky-glint font-medium">${track.price}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(track)}
                          className="text-soft-gray hover:text-sky-glint"
                          data-testid={`button-download-${track.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-soft-gray hover:text-sky-glint"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-soft-gray hover:text-sky-glint"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Volume2 className="w-16 h-16 text-soft-gray mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white-smoke mb-2">Select a Playlist</h2>
                <p className="text-soft-gray">Choose from our curated collection of royalty-free music</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm border-t border-sky-glint/20 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Track Info */}
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <img 
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-14 h-14 rounded object-cover"
                />
                <div className="min-w-0">
                  <h4 className="font-medium text-white-smoke truncate">{currentTrack.title}</h4>
                  <p className="text-sm text-soft-gray truncate">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-soft-gray hover:text-sky-glint">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlayPause(currentTrack)}
                  className="text-sky-glint hover:text-sky-glint/80"
                  data-testid="button-play-pause-main"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="text-soft-gray hover:text-sky-glint">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
                <Volume2 className="w-4 h-4 text-soft-gray" />
                <div className="w-24">
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    step={1}
                    className="text-sky-glint"
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-soft-gray">{formatTime(currentTime)}</span>
              <div className="flex-1 bg-soft-gray/20 h-1 rounded-full">
                <div 
                  className="bg-sky-glint h-1 rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-soft-gray">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}