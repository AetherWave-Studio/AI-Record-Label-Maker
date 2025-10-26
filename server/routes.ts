import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // API Routes
  
  // Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user credits
  app.get('/api/user/credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        credits: user.credits,
        subscriptionPlan: user.subscriptionPlan
      });
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Deduct user credits (internal server-side only - not exposed to client)
  // This should only be called by server-side generation endpoints after validating the request
  async function deductCredits(userId: string, amount: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    // Check if user has unlimited plan
    const unlimitedPlans = ['studio', 'creator', 'all_access'];
    if (unlimitedPlans.includes(user.subscriptionPlan)) {
      return true; // No deduction needed for unlimited plans
    }
    
    // Check if user has enough credits
    if (user.credits < amount) {
      return false; // Insufficient credits
    }
    
    // Deduct credits
    await storage.updateUserCredits(userId, user.credits - amount);
    return true;
  }

  // NOTE: POST /api/user/credits endpoint removed for security
  // Credits can only be modified server-side via generation endpoints

  const httpServer = createServer(app);

  return httpServer;
}
