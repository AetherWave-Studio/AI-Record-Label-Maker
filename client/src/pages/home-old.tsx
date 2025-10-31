import { useState } from "react";
import { Link } from "wouter";
import { Music, CloudUpload, Sliders, IdCard, Share, Download, ChartBar, Star } from "lucide-react";
import FileUpload from "@/components/file-upload";
import TradingCard from "@/components/trading-card";
import AuthForm from "@/components/auth-form";
import UserNavigation from "@/components/user-navigation";
import UserProgression from "@/components/user-progression";
import RankingDashboard from "@/components/ranking-dashboard";
import MyCards from "@/components/my-cards";
import { CreditBalance } from "@/components/CreditBalance";
import { useAuth } from "@/hooks/useAuth";
import { ArtistData, GenerationOptions } from "@shared/schema";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [cardId, setCardId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    artStyle: "realistic",
    cardTheme: "dark"
  });
  const [currentView, setCurrentView] = useState<"main" | "auth" | "my-cards">("main");
  
  const { isAuthenticated } = useAuth();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
  };

  const handleAnalysisComplete = (analysis: any, artist: ArtistData, generatedImageUrl?: string, generatedCardId?: string) => {
    setAnalysisData(analysis);
    setArtistData(artist);
    setImageUrl(generatedImageUrl || "");
    setCardId(generatedCardId || null);
    setIsProcessing(false);
  };

  // Handle different view states
  if (currentView === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AuthForm onSuccess={() => setCurrentView("main")} />
        </div>
      </div>
    );
  }

  if (currentView === "my-cards") {
    return <MyCards onBack={() => setCurrentView("main")} />;
  }

  return (
    <div className="bg-deep-slate text-white-smoke font-inter min-h-screen">
      {/* Header */}
      <header className="bg-charcoal/80 backdrop-blur-sm border-b border-sky-glint/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="text-sky-glint text-2xl" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-glint to-electric-blue bg-clip-text text-transparent">
                Virtual Artist Generator
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-soft-gray hover:text-sky-glint transition-colors" data-testid="link-how-it-works">How it Works</a>
                <Link href="/gallery" className="text-soft-gray hover:text-sky-glint transition-colors" data-testid="link-gallery">
                  Gallery
                </Link>
                <Link href="/music" className="text-soft-gray hover:text-sky-glint transition-colors" data-testid="link-music">
                  Music
                </Link>
                <Link href="/store" className="text-soft-gray hover:text-sky-glint transition-colors" data-testid="link-store">
                  Store
                </Link>
              </nav>
              <UserNavigation 
                onShowMyCards={() => setCurrentView("my-cards")}
                onShowAuth={() => setCurrentView("auth")}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white-smoke via-sky-glint to-electric-blue bg-clip-text text-transparent">
            Your Life in Music
          </h2>
          <p className="text-xl text-soft-gray mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your MP3 or WAV files and watch as AI creates unique artist identities, complete with trading card collectibles. Every song becomes a character, every beat becomes a story.
          </p>
        </div>
      </section>

      {/* Main App Interface */}
      <section className="px-6 pb-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Upload Section */}
            <div className="space-y-8">
              {/* Generation Options - Moved before upload */}
              <div className="bg-charcoal rounded-2xl p-8 border border-sky-glint/20">
                <h4 className="text-xl font-bold mb-6">
                  <Sliders className="text-sky-glint mr-3 inline" />
                  Card Customization
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-soft-gray mb-2">Art Style</label>
                    <select 
                      value={generationOptions.artStyle}
                      onChange={(e) => setGenerationOptions(prev => ({...prev, artStyle: e.target.value as GenerationOptions['artStyle']}))}
                      className="w-full bg-deep-slate border border-soft-gray/30 rounded-lg px-4 py-3 text-white-smoke focus:border-sky-glint focus:ring-2 focus:ring-sky-glint/20"
                      data-testid="select-art-style"
                    >
                      <option value="realistic">Realistic Portrait</option>
                      <option value="stylized">Stylized Illustration</option>
                      <option value="retro">Retro Poster</option>
                      <option value="abstract">Abstract Geometric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-soft-gray mb-2">Card Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setGenerationOptions(prev => ({...prev, cardTheme: "dark"}))}
                        className={`p-3 border-2 rounded-lg text-center hover:bg-sky-glint/30 transition-colors ${
                          generationOptions.cardTheme === "dark" ? "border-sky-glint bg-sky-glint/20" : "border-soft-gray/30"
                        }`}
                        data-testid="button-theme-dark"
                      >
                        <div className="text-lg mb-1">🌙</div>
                        <span className="text-xs">Dark</span>
                      </button>
                      <button 
                        onClick={() => setGenerationOptions(prev => ({...prev, cardTheme: "light"}))}
                        className={`p-3 border rounded-lg text-center hover:border-sky-glint hover:bg-sky-glint/10 transition-colors ${
                          generationOptions.cardTheme === "light" ? "border-sky-glint bg-sky-glint/20" : "border-soft-gray/30"
                        }`}
                        data-testid="button-theme-light"
                      >
                        <div className="text-lg mb-1">☀️</div>
                        <span className="text-xs">Light</span>
                      </button>
                      <button 
                        onClick={() => setGenerationOptions(prev => ({...prev, cardTheme: "vibrant"}))}
                        className={`p-3 border rounded-lg text-center hover:border-sky-glint hover:bg-sky-glint/10 transition-colors ${
                          generationOptions.cardTheme === "vibrant" ? "border-sky-glint bg-sky-glint/20" : "border-soft-gray/30"
                        }`}
                        data-testid="button-theme-vibrant"
                      >
                        <div className="text-lg mb-1">🎨</div>
                        <span className="text-xs">Vibrant</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section - Now after customization */}
              <div className="bg-charcoal rounded-2xl p-8 border border-sky-glint/20">
                <FileUpload 
                  onFileUpload={handleFileUpload}
                  onAnalysisComplete={handleAnalysisComplete}
                  isProcessing={isProcessing}
                  uploadedFile={uploadedFile}
                  analysisData={analysisData}
                  generationOptions={generationOptions}
                />
                
                {!isAuthenticated && (
                  <div className="mt-6 p-4 bg-sky-glint/10 border border-sky-glint/30 rounded-lg">
                    <p className="text-sm text-sky-glint text-center">
                      💡 <strong>Sign in</strong> to save your generated cards and build your collection!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Card Section */}
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  <IdCard className="text-sky-glint mr-3 inline" />
                  Generated Artist Card
                </h3>
                <p className="text-soft-gray">Your unique collectible trading card</p>
              </div>

              <TradingCard 
                artistData={artistData}
                imageUrl={imageUrl}
                theme={generationOptions.cardTheme}
                isProcessing={isProcessing}
                cardId={cardId || undefined}
                onFileUpload={handleFileUpload}
              />
              
              {/* User Progression Panel */}
              {isAuthenticated && (
                <div className="mt-8 space-y-6">
                  <CreditBalance />
                  <RankingDashboard />
                  <UserProgression />
                </div>
              )}

              {/* Generation Stats */}
              {analysisData && (
                <div className="bg-charcoal rounded-xl p-6 border border-sky-glint/20">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <ChartBar className="text-sky-glint mr-2" />
                    Generation Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-soft-gray">Processing Time:</span>
                      <span className="text-white-smoke font-medium ml-2" data-testid="text-processing-time">
                        {analysisData.processingTime || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-soft-gray">AI Confidence:</span>
                      <span className="text-electric-blue font-medium ml-2" data-testid="text-confidence">
                        {analysisData.confidence || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-soft-gray">Audio Quality:</span>
                      <span className="text-sky-glint font-medium ml-2" data-testid="text-quality">
                        {analysisData.quality || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-soft-gray">Uniqueness Score:</span>
                      <span className="text-white-smoke font-medium ml-2" data-testid="text-uniqueness">
                        {analysisData.uniqueness || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-charcoal/40">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            How <span className="text-sky-glint">SoundCard</span> Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Music production studio" 
                className="w-full h-48 object-cover rounded-xl mx-auto" 
              />
              <h4 className="text-xl font-semibold">1. Upload & Analyze</h4>
              <p className="text-soft-gray">Advanced AI analyzes your music's genre, tempo, key, and emotional signature to understand its unique DNA.</p>
            </div>
            <div className="text-center space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Virtual Artist performance" 
                className="w-full h-48 object-cover rounded-xl mx-auto" 
              />
              <h4 className="text-xl font-semibold">2. Generate Identity</h4>
              <p className="text-soft-gray">Creates a complete artist persona with backstory, members, philosophy, and visual identity tailored to your sound.</p>
            </div>
            <div className="text-center space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Audio waveforms" 
                className="w-full h-48 object-cover rounded-xl mx-auto" 
              />
              <h4 className="text-xl font-semibold">3. Craft Your Card</h4>
              <p className="text-soft-gray">Produces a professional trading card with custom artwork, complete with front and back designs ready to collect and share.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal border-t border-sky-glint/20 py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Music className="text-sky-glint text-xl" />
                <h4 className="font-bold text-lg">SoundCard</h4>
              </div>
              <p className="text-soft-gray text-sm">Transform your music into collectible art with AI-powered artist identity generation.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Features</h5>
              <ul className="space-y-2 text-sm text-soft-gray">
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-audio-analysis">Audio Analysis</a></li>
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-ai-art">AI Art Generation</a></li>
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-trading-cards">Trading Cards</a></li>
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-export">Export & Share</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-sm text-soft-gray">
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-docs">Documentation</a></li>
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-api-ref">API Reference</a></li>
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-community">Community</a></li>
                <li><a href="#" className="hover:text-sky-glint transition-colors" data-testid="link-contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Connect</h5>
              <div className="flex space-x-4">
                <a href="#" className="text-soft-gray hover:text-sky-glint transition-colors text-xl" data-testid="link-twitter">🐦</a>
                <a href="#" className="text-soft-gray hover:text-sky-glint transition-colors text-xl" data-testid="link-github">🐙</a>
                <a href="#" className="text-soft-gray hover:text-sky-glint transition-colors text-xl" data-testid="link-discord">💬</a>
                <a href="#" className="text-soft-gray hover:text-sky-glint transition-colors text-xl" data-testid="link-youtube">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-sky-glint/20 mt-8 pt-8 text-center text-sm text-soft-gray">
            <p>&copy; 2024 SoundCard Generator. All rights reserved. • Made with ❤️ for music creators</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
