import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

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

  // Serve static HTML directories before the SPA catch-all
  const rootDir = path.resolve(import.meta.dirname, '..');
  
  // Serve the landing page at root
  app.get('/', (_req, res) => {
    res.sendFile(path.join(rootDir, 'static', 'index.html'));
  });
  app.use('/virtual-artists', express.static(path.join(rootDir, 'virtual-artists')));
  app.use('/creators-lounge', express.static(path.join(rootDir, 'creators-lounge')));
  app.use('/playlists', express.static(path.join(rootDir, 'Playlists')));
  app.use('/featured-artist', express.static(path.join(rootDir, 'Featured Artist')));
  app.use('/video-generation', express.static(path.join(rootDir, 'video-generation')));
  app.use('/seamless-loop-creator', express.static(path.join(rootDir, 'seamless-loop-creator')));
  app.use('/static', express.static(path.join(rootDir, 'static')));
  app.use('/welcome', express.static(path.join(rootDir, 'welcome')));
  app.use('/aimusic-media', express.static(path.join(rootDir, 'aimusic-media')));


  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
