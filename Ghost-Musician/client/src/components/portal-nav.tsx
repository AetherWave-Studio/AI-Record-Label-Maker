import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Portal, ArrowRight, User, Home, Zap, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PortalNavProps {
  variant?: 'profile-entry' | 'aetherwave-exit';
  className?: string;
}

export function PortalNav({ variant = 'profile-entry', className = '' }: PortalNavProps) {
  const { user } = useAuth();
  const [isHovering, setIsHovering] = useState(false);
  const [portalActive, setPortalActive] = useState(false);

  if (variant === 'profile-entry') {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-indigo-900/20 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Portal Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-indigo-600/10 animate-pulse" />

            <motion.div
              className="relative z-10 text-center"
              onHoverStart={() => setIsHovering(true)}
              onHoverEnd={() => setIsHovering(false)}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Portal Animation */}
              <motion.div
                className="mx-auto w-20 h-20 mb-4 relative"
                animate={{
                  rotate: isHovering ? 360 : 0,
                  scale: isHovering ? 1.1 : 1,
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60" />
                <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Portal className="w-8 h-8 text-white" />
                </div>

                {/* Orbiting particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      transformOrigin: "40px 40px",
                      left: `${40 + 30 * Math.cos((i * Math.PI) / 3)}px`,
                      top: `${40 + 30 * Math.sin((i * Math.PI) / 3)}px`,
                    }}
                  />
                ))}
              </motion.div>

              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                Enter AetherWave Studio
              </h3>

              <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
                Step through the portal to access AI-powered media generation tools and create stunning content
              </p>

              <Link href="/static/aimusic-media.html">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 group"
                    onMouseEnter={() => setPortalActive(true)}
                    onMouseLeave={() => setPortalActive(false)}
                  >
                    <AnimatePresence>
                      {portalActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </AnimatePresence>

                    <span className="relative flex items-center gap-2 z-10">
                      <Sparkles className="w-4 h-4" />
                      Enter Portal
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>

                    {/* Particle effect on hover */}
                    {portalActive && (
                      <div className="absolute inset-0">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            initial={{
                              opacity: 1,
                              scale: 0,
                              left: '50%',
                              top: '50%'
                            }}
                            animate={{
                              opacity: 0,
                              scale: [0, 1, 0],
                              x: (Math.random() - 0.5) * 200,
                              y: (Math.random() - 0.5) * 100,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Button>
                </motion.div>
              </Link>

              {/* Portal status indicator */}
              <motion.div
                className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500"
                animate={{ opacity: isHovering ? 1 : 0.6 }}
              >
                <Circle className="w-2 h-2 text-green-400 animate-pulse" />
                <span>Portal Active</span>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // AetherWave Exit Portal
  return (
    <motion.div
      className={`fixed bottom-8 right-8 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Portal glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60 animate-pulse" />

        <Link href={`/ghost-musician/user/${user?.id}`}>
          <motion.div
            className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer shadow-2xl"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Home className="w-6 h-6 text-white" />

            {/* Exit portal particles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-white rounded-full"
                animate={{
                  rotate: -360,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  transformOrigin: "32px 32px",
                  left: `${32 + 20 * Math.cos((i * Math.PI) / 2)}px`,
                  top: `${32 + 20 * Math.sin((i * Math.PI) / 2)}px`,
                }}
              />
            ))}
          </motion.div>
        </Link>

        {/* Tooltip */}
        <motion.div
          className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          Return to Profile
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}