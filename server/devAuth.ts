import type { Express, RequestHandler } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Dev superuser configuration
const DEV_USER: User = {
  id: 'dev-user-123',
  email: 'dev@localhost',
  firstName: 'Dev',
  lastName: 'User',
  profileImageUrl: null,
  username: 'devuser',
  vocalGenderPreference: 'm',
  credits: 10000,
  subscriptionPlan: 'all_access',
  lastCreditReset: new Date(),
  welcomeBonusClaimed: 1,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Initialize dev user in storage
async function initializeDevUser() {
  try {
    const existingUser = await storage.getUser(DEV_USER.id);
    if (!existingUser) {
      console.log('🔧 Creating dev superuser...');
      await storage.upsertUser(DEV_USER);
      console.log('✅ Dev superuser created:', {
        id: DEV_USER.id,
        email: DEV_USER.email,
        plan: DEV_USER.subscriptionPlan,
        credits: DEV_USER.credits,
      });
    } else {
      console.log('✅ Dev superuser already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        plan: existingUser.subscriptionPlan,
        credits: existingUser.credits,
      });
    }
  } catch (error) {
    console.error('⚠️  Could not create dev user in database (using memory storage):', error);
    // User will still exist in memory through the session
  }
}

// Setup dev authentication
export async function setupDevAuth(app: Express) {
  console.log('🔧 Setting up development authentication...');

  // Initialize dev user
  await initializeDevUser();

  // Use memory-based session store for dev
  const MemStore = MemoryStore(session);
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    store: new MemStore({
      checkPeriod: sessionTtl,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow non-HTTPS in dev
      maxAge: sessionTtl,
    },
  }));

  // Redirect /api/login to /api/dev/login in dev mode
  app.get('/api/login', (req: any, res) => {
    res.redirect('/api/dev/login');
  });

  // Auto-login route for dev
  app.get('/api/dev/login', (req: any, res) => {
    req.session.devUser = {
      claims: {
        sub: DEV_USER.id,
        email: DEV_USER.email,
        first_name: DEV_USER.firstName,
        last_name: DEV_USER.lastName,
        profile_image_url: DEV_USER.profileImageUrl,
      },
      expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week from now
    };

    console.log('✅ Dev user logged in:', DEV_USER.email);
    res.redirect('/');
  });

  // Logout route
  app.get('/api/logout', (req: any, res) => {
    req.session.destroy(() => {
      console.log('👋 Dev user logged out');
      res.redirect('/');
    });
  });

  console.log('✅ Dev authentication ready');
  console.log('📝 To login, visit: http://localhost:5000/api/dev/login');
}

// Dev authentication middleware
export const isDevAuthenticated: RequestHandler = async (req: any, res, next) => {
  const devUser = req.session?.devUser;

  if (!devUser || !devUser.expires_at) {
    return res.status(401).json({
      message: "Unauthorized - Please login at /api/dev/login",
      loginUrl: '/api/dev/login'
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > devUser.expires_at) {
    return res.status(401).json({
      message: "Session expired - Please login again at /api/dev/login",
      loginUrl: '/api/dev/login'
    });
  }

  // Inject user into request in the same format as Replit Auth
  // Normalize the user object to have id at top level
  req.user = {
    ...devUser,
    id: devUser.id || devUser.claims?.sub || devUser.userinfo?.sub
  };
  next();
};
