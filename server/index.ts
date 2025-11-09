import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { maintenanceMiddleware } from "./maintenance";
import path from "path";
import { promises as fs } from "fs";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '100mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Lightweight health check endpoint for deployment health checks
// Must be BEFORE maintenance middleware to respond quickly
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Maintenance mode - shows "Coming Soon" page to visitors
app.use(maintenanceMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static HTML directories and landing page
  const rootDir = path.resolve(import.meta.dirname, '..');
  
  // Redirect root to static directory
  app.get('/', (_req, res) => {
    res.redirect('/static/');
  });
  
  // Serve all static HTML directories
  app.use('/virtual-artists', express.static(path.join(rootDir, 'virtual-artists')));
  app.use('/creator-studio', express.static(path.join(rootDir, 'creators-lounge')));
  app.use('/playlists', express.static(path.join(rootDir, 'Playlists')));
  app.use('/featured-artist', express.static(path.join(rootDir, 'Featured Artist')));
  app.use('/video-generation', express.static(path.join(rootDir, 'video-generation')));
  app.use('/seamless-loop-creator', express.static(path.join(rootDir, 'seamless-loop-creator')));
  app.use('/static', express.static(path.join(rootDir, 'static')));
  app.use('/welcome', express.static(path.join(rootDir, 'welcome')));
  app.use('/aimusic-media', express.static(path.join(rootDir, 'aimusic-media')));

  // Setup Vite in development to serve the React SPA for feature pages
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Handle React SPA routes - these should be served by the React app
  const reactRoutes = ['/profile', '/buy-credits', '/card-shop', '/seamless-loop-creator', '/channels'];

  if (app.get("env") === "development") {
    // In development, serve React app for specific routes
    app.use(reactRoutes, async (req, res, next) => {
      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "index.html",
        );
        console.log(`Serving React route ${req.path} from: ${clientTemplate}`);
        const template = await fs.readFile(clientTemplate, "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error(`Error serving React route ${req.path}:`, e);
        next(e);
      }
    });
  } else {
    // In production, serve built React app
    app.use(reactRoutes, (req, res) => {
      const distPath = path.resolve(import.meta.dirname, "..", "dist");
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // Bind to 0.0.0.0 to make the server accessible from outside the container (required for publishing)
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });
})();
