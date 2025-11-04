import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Home, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PortalNavProps {
  variant?: 'profile-entry' | 'aetherwave-exit';
  className?: string;
}

export function PortalNavSimple({ variant = 'profile-entry', className = '' }: PortalNavProps) {
  const { user } = useAuth();
  const [isHovering, setIsHovering] = useState(false);

  if (variant === 'profile-entry') {
    return (
      <div className={`relative ${className}`}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-indigo-900/20 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Portal Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10 animate-pulse" />

            <div className="relative z-10 text-center">
              {/* Portal Animation */}
              <div className="mx-auto w-20 h-20 mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60" />
                <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                Enter AetherWave Studio
              </h3>

              <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
                Step through the portal to access AI-powered media generation tools and create stunning content
              </p>

              <Link href="/static/aimusic-media.html">
                <Button
                  size="lg"
                  className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 group"
                >
                  <span className="relative flex items-center gap-2 z-10">
                    <Sparkles className="w-4 h-4" />
                    Enter Portal
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>

              {/* Portal status indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Portal Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // AetherWave Exit Portal (simpler version)
  return (
    <div className={`fixed bottom-8 right-8 z-50 ${className}`}>
      <div className="relative">
        {/* Portal glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60 animate-pulse" />

        <Link href={`/ghost-musician/user/${user?.id}`}>
          <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer shadow-2xl">
            <Home className="w-6 h-6 text-white" />
          </div>
        </Link>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
          Return to Profile
        </div>
      </div>
    </div>
  );
}