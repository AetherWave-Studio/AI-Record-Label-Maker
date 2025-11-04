import { Music, IdCard, CloudUpload, Users } from "lucide-react";
import { ArtistSearch } from "@/components/ArtistSearch";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-slate via-charcoal to-deep-slate">
      {/* Header */}
      <header className="px-6 py-4 border-b border-soft-gray/20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-sky-glint to-electric-blue p-2 rounded-lg">
                <Music className="text-deep-slate" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white-smoke to-sky-glint bg-clip-text text-transparent">
                Virtual Artist Generator
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="/api/login"
                className="bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                data-testid="button-login"
              >
                Sign In with Replit
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white-smoke via-sky-glint to-electric-blue bg-clip-text text-transparent">
            Your Life in Music
          </h2>
          <p className="text-xl text-soft-gray mb-12 max-w-4xl mx-auto leading-relaxed">
            Upload your MP3 or WAV files and watch as AI creates unique Virtual Artist identities, complete with trading card collectibles. 
            Every song becomes a character, every beat becomes a story.
          </p>

          {/* Artist Search */}
          <div className="mb-12 bg-gradient-to-r from-charcoal/20 to-deep-slate/20 p-8 rounded-2xl border border-soft-gray/10">
            <h3 className="text-2xl font-bold text-white-smoke mb-4 text-center">
              Discover Existing Artists
            </h3>
            <ArtistSearch />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="/api/login"
              className="bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all"
              data-testid="button-get-started"
            >
              Get Started Free
            </a>
            <p className="text-soft-gray text-sm">
              No signup required • Create unlimited Virtual Artists
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-charcoal/40">
        <div className="container mx-auto">
          <h3 className="text-4xl font-bold text-center mb-16 text-white-smoke">
            How It Works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-sky-glint to-electric-blue p-4 rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
                <CloudUpload className="text-deep-slate" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white-smoke">1. Upload Audio</h4>
              <p className="text-soft-gray">
                Drop your MP3 or WAV files and let our AI analyze the musical characteristics, tempo, and energy.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-sky-glint to-electric-blue p-4 rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
                <Users className="text-deep-slate" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white-smoke">2. AI Creates Artist</h4>
              <p className="text-soft-gray">
                Our AI generates a complete fictional artist identity with backstory, band members, and visual style.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-sky-glint to-electric-blue p-4 rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
                <IdCard className="text-deep-slate" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white-smoke">3. Get Trading Card</h4>
              <p className="text-soft-gray">
                Receive a beautiful 5x7 sports-style trading card with front and back design, plus detailed PDF profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-8 text-white-smoke">
            Ready to Transform Your Music?
          </h3>
          <p className="text-lg text-soft-gray mb-8 max-w-2xl mx-auto">
            Join thousands of musicians creating unique artist identities. Sign in with your Replit account to get started.
          </p>
          <a 
            href="/api/login"
            className="bg-gradient-to-r from-sky-glint to-electric-blue text-deep-slate px-10 py-4 rounded-lg font-bold text-xl hover:shadow-xl transition-all inline-block"
            data-testid="button-cta-login"
          >
            Sign In with Replit
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-soft-gray/20">
        <div className="container mx-auto text-center">
          <p className="text-soft-gray">
            Built with ❤️ on Replit • Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
}