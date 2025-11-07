import type { Request, Response, NextFunction } from "express";

// Toggle this to enable/disable maintenance mode
export const MAINTENANCE_MODE = true;

// Bypass key - add ?bypass=your_secret_key to URL to access the app during maintenance
const BYPASS_KEY = process.env.MAINTENANCE_BYPASS_KEY || "dev123";

export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip maintenance mode if disabled
  if (!MAINTENANCE_MODE) {
    return next();
  }

  // Allow bypass with secret key
  if (req.query.bypass === BYPASS_KEY) {
    return next();
  }

  // Allow API health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Show maintenance page for all other routes
  res.status(503).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AetherWave Studio - Coming Soon</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #4a1e6b 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        /* Animated background particles */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 20s infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-100px) translateX(100px); }
          50% { transform: translateY(-200px) translateX(-100px); }
          75% { transform: translateY(-100px) translateX(-100px); }
        }
        
        .container {
          text-align: center;
          z-index: 1;
          max-width: 800px;
          padding: 2rem;
        }
        
        .logo {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
          animation: glow 3s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(236, 72, 153, 0.8)); }
        }
        
        h1 {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }
        
        p {
          font-size: 1.25rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 3rem;
        }
        
        .feature {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: transform 0.3s ease;
        }
        
        .feature:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
        }
        
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        
        .feature-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .feature-desc {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .cta {
          margin-top: 2rem;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        @media (max-width: 768px) {
          .logo { font-size: 2.5rem; }
          h1 { font-size: 2rem; }
          p { font-size: 1rem; }
          .features { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="particles">
        <div class="particle" style="width: 100px; height: 100px; top: 20%; left: 10%; animation-delay: 0s;"></div>
        <div class="particle" style="width: 60px; height: 60px; top: 60%; left: 80%; animation-delay: 2s;"></div>
        <div class="particle" style="width: 80px; height: 80px; top: 80%; left: 20%; animation-delay: 4s;"></div>
        <div class="particle" style="width: 120px; height: 120px; top: 40%; left: 70%; animation-delay: 1s;"></div>
      </div>
      
      <div class="container">
        <div class="logo">AetherWave</div>
        <h1>Coming Soon</h1>
        <p>
          We're crafting the ultimate AI-powered creative studio for music, video, and image generation.
          Get ready to unleash your creativity with cutting-edge AI tools.
        </p>
        
        <!-- Featured Video -->
        <div style="margin: 2rem 0; border-radius: 1rem; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <div style="position: relative; padding-bottom: 56.25%; height: 0;">
            <iframe 
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
              src="https://www.youtube.com/embed/1iKkiuoUoLs?si=350ig1iisiSEW-Tj&autoplay=0&mute=0&rel=0&modestbranding=1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
        
        <div class="features">
          <div class="feature">
            <div class="feature-icon">🎵</div>
            <div class="feature-title">AI Music</div>
            <div class="feature-desc">Generate professional tracks with advanced AI models</div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🎬</div>
            <div class="feature-title">Video Creation</div>
            <div class="feature-desc">Create stunning videos with seamless looping</div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🎨</div>
            <div class="feature-title">Image Generation</div>
            <div class="feature-desc">Design unique visuals with multiple AI engines</div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">💎</div>
            <div class="feature-title">Premium Quality</div>
            <div class="feature-desc">Professional-grade output for your projects</div>
          </div>
        </div>
        
        <div class="cta">
          Launching soon. Stay tuned for something amazing.
        </div>
      </div>
    </body>
    </html>
  `);
}
