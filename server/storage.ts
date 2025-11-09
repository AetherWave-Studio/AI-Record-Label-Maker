import { type User, type UpsertUser, type CreditCheckResult, type CreditDeductionResult, SERVICE_CREDIT_COSTS, UNLIMITED_SERVICE_PLANS, type ServiceType, type PlanType, users, FREE_TIER_WELCOME_BONUS, FREE_TIER_DAILY_CREDITS, FREE_TIER_CREDIT_CAP, type Product, type InsertProduct, products, type UserInventory, type InsertUserInventory, userInventory } from "#shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, desc } from "drizzle-orm";
import ws from "ws";

// Configure Neon for WebSocket
neonConfig.webSocketConstructor = ws;

// Storage interface for user and credit operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Credit operations
  updateUserCredits(userId: string, credits: number, lastCreditReset?: Date): Promise<User | undefined>;
  addCredits(userId: string, amount: number): Promise<User>; // Add credits to user (for purchases)
  deductCredits(userId: string, serviceType: ServiceType): Promise<CreditDeductionResult>;
  checkCredits(userId: string, serviceType: ServiceType): Promise<CreditCheckResult>;
  refundCredits(userId: string, serviceType: ServiceType): Promise<{ success: boolean; newBalance: number; amountRefunded: number; error?: string }>;
  resetDailyCredits(userId: string): Promise<void>; // Reset credits for free tier users (with 50 cap)
  
  // User preference operations
  updateUserVocalPreference(userId: string, vocalGenderPreference: string): Promise<User | undefined>;
  updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined>;
  
  // ============================================================================
  // MARKETPLACE OPERATIONS
  // ============================================================================
  
  // Get all products (optionally filtered by category)
  getProducts(category?: string): Promise<Product[]>;
  
  // Get a single product by ID
  getProduct(productId: string): Promise<Product | undefined>;
  
  // Get user's inventory
  getUserInventory(userId: string): Promise<UserInventory[]>;
  
  // Purchase a product
  purchaseProduct(userId: string, productId: string, quantity?: number): Promise<{
    success: boolean;
    product?: Product;
    newBalance?: number;
    totalCost?: number;
    error?: string;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);

    const user: User = {
      id: userData.id || '',
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      username: userData.username || null,
      lastUsernameChange: userData.lastUsernameChange || existingUser?.lastUsernameChange || null,
      vocalGenderPreference: userData.vocalGenderPreference || existingUser?.vocalGenderPreference || 'm',
      subscriptionPlan: userData.subscriptionPlan || existingUser?.subscriptionPlan || 'free',
      credits: existingUser?.credits ?? userData.credits ?? FREE_TIER_WELCOME_BONUS,
      welcomeBonusClaimed: existingUser?.welcomeBonusClaimed ?? 1, // Automatically claim for new users
      lastCreditReset: userData.lastCreditReset || existingUser?.lastCreditReset || new Date(),
      stripeCustomerId: userData.stripeCustomerId || existingUser?.stripeCustomerId || null,
      stripeSubscriptionId: userData.stripeSubscriptionId || existingUser?.stripeSubscriptionId || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async updateUserCredits(userId: string, credits: number, lastCreditReset?: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    user.credits = credits;
    user.updatedAt = new Date();
    if (lastCreditReset) {
      user.lastCreditReset = lastCreditReset;
    }
    this.users.set(userId, user);
    return user;
  }

  async decrementFreeBandGenerations(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, remaining: 0, error: 'User not found' };
    }
    
    if (user.freeBandGenerations <= 0) {
      return { success: false, remaining: 0, error: 'No free band generations remaining' };
    }
    
    user.freeBandGenerations -= 1;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    return { success: true, remaining: user.freeBandGenerations };
  }

  async incrementFreeBandGenerations(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, remaining: 0, error: 'User not found' };
    }
    
    user.freeBandGenerations += 1;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    return { success: true, remaining: user.freeBandGenerations };
  }

  async addCredits(userId: string, amount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.credits += amount;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    return user;
  }

  async deductCredits(userId: string, serviceType: ServiceType): Promise<CreditDeductionResult> {
    const user = this.users.get(userId);
    
    if (!user) {
      return {
        success: false,
        newBalance: 0,
        amountDeducted: 0,
        wasUnlimited: false,
        error: 'User not found'
      };
    }
    
    // Check if user has unlimited plan for this service
    const unlimitedPlans = UNLIMITED_SERVICE_PLANS[serviceType];
    const userPlan = user.subscriptionPlan as PlanType;

    // Safety check: if service not found in unlimited plans, assume no unlimited access
    if (unlimitedPlans && unlimitedPlans.includes(userPlan)) {
      return {
        success: true,
        newBalance: user.credits,
        amountDeducted: 0,
        wasUnlimited: true
      };
    }
    
    // Check if user has enough credits
    const creditCost = SERVICE_CREDIT_COSTS[serviceType];
    if (user.credits < creditCost) {
      return {
        success: false,
        newBalance: user.credits,
        amountDeducted: 0,
        wasUnlimited: false,
        error: `Insufficient credits. Need ${creditCost}, have ${user.credits}`
      };
    }
    
    // Deduct credits
    user.credits -= creditCost;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    return {
      success: true,
      newBalance: user.credits,
      amountDeducted: creditCost,
      wasUnlimited: false
    };
  }

  async refundCredits(userId: string, serviceType: ServiceType): Promise<{ success: boolean; newBalance: number; amountRefunded: number; error?: string }> {
    const user = this.users.get(userId);
    
    if (!user) {
      return {
        success: false,
        newBalance: 0,
        amountRefunded: 0,
        error: 'User not found'
      };
    }
    
    // CRITICAL: Check if user has unlimited plan for this service
    // If they do, they never had credits deducted, so don't refund
    const unlimitedPlans = UNLIMITED_SERVICE_PLANS[serviceType];
    const userPlan = user.subscriptionPlan as PlanType;

    // Safety check: if service not found in unlimited plans, assume no unlimited access
    if (unlimitedPlans && unlimitedPlans.includes(userPlan)) {
      // User has unlimited plan - no credits were deducted, so nothing to refund
      return {
        success: true,
        newBalance: user.credits,
        amountRefunded: 0 // No refund needed for unlimited users
      };
    }
    
    // Get credit cost for this service
    const creditCost = SERVICE_CREDIT_COSTS[serviceType];
    
    // Add credits back
    user.credits += creditCost;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    return {
      success: true,
      newBalance: user.credits,
      amountRefunded: creditCost
    };
  }

  async checkCredits(userId: string, serviceType: ServiceType): Promise<CreditCheckResult> {
    const user = this.users.get(userId);
    
    if (!user) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        currentCredits: 0,
        requiredCredits: SERVICE_CREDIT_COSTS[serviceType]
      };
    }
    
    // Check if user has unlimited plan for this service
    const unlimitedPlans = UNLIMITED_SERVICE_PLANS[serviceType];
    const userPlan = user.subscriptionPlan as PlanType;

    // Safety check: if service not found in unlimited plans, assume no unlimited access
    if (unlimitedPlans && unlimitedPlans.includes(userPlan)) {
      return {
        allowed: true,
        reason: 'unlimited',
        currentCredits: user.credits,
        requiredCredits: 0,
        planType: userPlan
      };
    }
    
    // Check if user has enough credits
    const creditCost = SERVICE_CREDIT_COSTS[serviceType];
    if (user.credits < creditCost) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        currentCredits: user.credits,
        requiredCredits: creditCost,
        planType: userPlan
      };
    }
    
    return {
      allowed: true,
      reason: 'success',
      currentCredits: user.credits,
      requiredCredits: creditCost,
      planType: userPlan
    };
  }

  async updateUserVocalPreference(userId: string, vocalGenderPreference: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.vocalGenderPreference = vocalGenderPreference;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.profileImageUrl = profileImageUrl;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async resetDailyCredits(userId: string): Promise<void> {
    // Stub implementation for MemStorage
    const user = this.users.get(userId);
    if (!user || user.subscriptionPlan !== 'free') return;

    // Free tier: add 10 credits/day, but cap at 50
    if (user.credits < FREE_TIER_CREDIT_CAP) {
      user.credits = Math.min(user.credits + FREE_TIER_DAILY_CREDITS, FREE_TIER_CREDIT_CAP);
      user.lastCreditReset = new Date();
      this.users.set(userId, user);
    }
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    // Stub implementation for MemStorage
    return [];
  }

  async completeQuest(userId: string, questType: QuestType): Promise<{ success: boolean; creditsAwarded: number; error?: string }> {
    // Stub implementation for MemStorage
    return { success: false, creditsAwarded: 0, error: 'Quest system not available in memory storage' };
  }

  async recordDailyLogin(userId: string): Promise<{ success: boolean; creditsAwarded: number; streak: number; firstLoginToday: boolean; error?: string }> {
    // Stub implementation for MemStorage
    return { success: false, creditsAwarded: 0, streak: 0, firstLoginToday: false, error: 'Daily login system not available in memory storage' };
  }

  async createFeedEvent(event: InsertFeedEvent): Promise<FeedEvent> {
    throw new Error('Feed system not available in memory storage');
  }

  async getFeedEvents(limit?: number, offset?: number): Promise<FeedEvent[]> {
    return [];
  }

  async getUserFeedEvents(userId: string, limit?: number): Promise<FeedEvent[]> {
    return [];
  }

  // GhostMusician RPG stub implementations
  async createBand(band: InsertBand): Promise<Band> {
    throw new Error('GhostMusician RPG not available in memory storage');
  }

  async getUserBands(userId: string): Promise<Band[]> {
    return [];
  }

  async getBand(bandId: string): Promise<Band | undefined> {
    return undefined;
  }

  async updateBand(bandId: string, updates: Partial<Band>): Promise<Band | undefined> {
    return undefined;
  }

  async deleteBand(bandId: string): Promise<boolean> {
    return false;
  }

  async applyDailyGrowth(userId: string, bandId: string): Promise<{ success: boolean; band?: Band; growthApplied?: { fameGrowth: number; streamsAdded: number; digitalAdded: number; physicalAdded: number; }; error?: string; }> {
    return { success: false, error: 'GhostMusician RPG not available in memory storage' };
  }

  async checkAndAwardAchievements(bandId: string): Promise<BandAchievement[]> {
    return [];
  }

  async getBandAchievements(bandId: string): Promise<BandAchievement[]> {
    return [];
  }

  async deductRpgCredits(userId: string, serviceType: RpgServiceType): Promise<CreditDeductionResult> {
    return { success: false, newBalance: 0, amountDeducted: 0, wasUnlimited: false, error: 'GhostMusician RPG not available in memory storage' };
  }

  async checkRpgCredits(userId: string, serviceType: RpgServiceType): Promise<CreditCheckResult> {
    return { allowed: false, reason: 'insufficient_credits', currentCredits: 0, requiredCredits: 0 };
  }

  async checkBandLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number | 'unlimited'; error?: string; }> {
    return { allowed: false, current: 0, limit: 0, error: 'GhostMusician RPG not available in memory storage' };
  }

  async getOwnedCardDesigns(userId: string): Promise<string[]> {
    // Default: everyone owns ghosts_online for free
    return ['ghosts_online'];
  }

  async purchaseCardDesign(userId: string, designId: string, price: number): Promise<{ success: boolean; newBalance?: number; error?: string; }> {
    return { success: false, error: 'Card design system not available in memory storage' };
  }

  async equipCardDesign(bandId: string, designId: string): Promise<{ success: boolean; error?: string; }> {
    return { success: false, error: 'Card design system not available in memory storage' };
  }
  
  // Marketplace operations (stubs for MemStorage)
  async getProducts(category?: string): Promise<Product[]> {
    return [];
  }
  
  async getProduct(productId: string): Promise<Product | undefined> {
    return undefined;
  }
  
  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return [];
  }
  
  async purchaseProduct(userId: string, productId: string, quantity: number = 1): Promise<{
    success: boolean;
    product?: Product;
    newBalance?: number;
    totalCost?: number;
    error?: string;
  }> {
    return { success: false, error: 'Marketplace not available in memory storage' };
  }
}

// Database-backed storage using Drizzle ORM
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Try to insert, if conflict on id then update
    const result = await this.db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        username: userData.username || null,
        lastUsernameChange: userData.lastUsernameChange || null,
        vocalGenderPreference: userData.vocalGenderPreference || 'm',
        subscriptionPlan: userData.subscriptionPlan || 'free',
        credits: userData.credits ?? FREE_TIER_WELCOME_BONUS, // New users get welcome bonus
        welcomeBonusClaimed: 1, // Auto-claim for new users
        lastCreditReset: userData.lastCreditReset || new Date(),
        stripeCustomerId: userData.stripeCustomerId || null,
        stripeSubscriptionId: userData.stripeSubscriptionId || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImageUrl: userData.profileImageUrl || null,
          username: userData.username || null,
          lastUsernameChange: userData.lastUsernameChange,
          vocalGenderPreference: userData.vocalGenderPreference,
          subscriptionPlan: userData.subscriptionPlan,
          stripeCustomerId: userData.stripeCustomerId,
          stripeSubscriptionId: userData.stripeSubscriptionId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async updateUserCredits(userId: string, credits: number, lastCreditReset?: Date): Promise<User | undefined> {
    const updateData: any = {
      credits,
      updatedAt: new Date(),
    };
    
    if (lastCreditReset) {
      updateData.lastCreditReset = lastCreditReset;
    }
    
    const result = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async decrementFreeBandGenerations(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return { success: false, remaining: 0, error: 'User not found' };
    }
    
    if (user.freeBandGenerations <= 0) {
      return { success: false, remaining: 0, error: 'No free band generations remaining' };
    }
    
    const result = await this.db
      .update(users)
      .set({ 
        freeBandGenerations: user.freeBandGenerations - 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return { success: true, remaining: result[0].freeBandGenerations };
  }

  async incrementFreeBandGenerations(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return { success: false, remaining: 0, error: 'User not found' };
    }
    
    const result = await this.db
      .update(users)
      .set({ 
        freeBandGenerations: user.freeBandGenerations + 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return { success: true, remaining: result[0].freeBandGenerations };
  }

  async addCredits(userId: string, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const result = await this.db
      .update(users)
      .set({ 
        credits: user.credits + amount,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async deductCredits(userId: string, serviceType: ServiceType): Promise<CreditDeductionResult> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return {
        success: false,
        newBalance: 0,
        amountDeducted: 0,
        wasUnlimited: false,
        error: 'User not found'
      };
    }
    
    // Check if user has unlimited plan for this service
    const unlimitedPlans = UNLIMITED_SERVICE_PLANS[serviceType];
    const userPlan = user.subscriptionPlan as PlanType;

    // Safety check: if service not found in unlimited plans, assume no unlimited access
    if (unlimitedPlans && unlimitedPlans.includes(userPlan)) {
      return {
        success: true,
        newBalance: user.credits,
        amountDeducted: 0,
        wasUnlimited: true
      };
    }
    
    // Check if user has enough credits
    const creditCost = SERVICE_CREDIT_COSTS[serviceType];
    if (user.credits < creditCost) {
      return {
        success: false,
        newBalance: user.credits,
        amountDeducted: 0,
        wasUnlimited: false,
        error: `Insufficient credits. Need ${creditCost}, have ${user.credits}`
      };
    }
    
    // Deduct credits
    const newBalance = user.credits - creditCost;
    await this.updateUserCredits(userId, newBalance);
    
    return {
      success: true,
      newBalance,
      amountDeducted: creditCost,
      wasUnlimited: false
    };
  }

  async refundCredits(userId: string, serviceType: ServiceType): Promise<{ success: boolean; newBalance: number; amountRefunded: number; error?: string }> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return {
        success: false,
        newBalance: 0,
        amountRefunded: 0,
        error: 'User not found'
      };
    }
    
    // CRITICAL: Check if user has unlimited plan for this service
    // If they do, they never had credits deducted, so don't refund
    const unlimitedPlans = UNLIMITED_SERVICE_PLANS[serviceType];
    const userPlan = user.subscriptionPlan as PlanType;

    // Safety check: if service not found in unlimited plans, assume no unlimited access
    if (unlimitedPlans && unlimitedPlans.includes(userPlan)) {
      // User has unlimited plan - no credits were deducted, so nothing to refund
      return {
        success: true,
        newBalance: user.credits,
        amountRefunded: 0 // No refund needed for unlimited users
      };
    }
    
    // Get credit cost for this service
    const creditCost = SERVICE_CREDIT_COSTS[serviceType];
    
    // Add credits back
    const newBalance = user.credits + creditCost;
    await this.updateUserCredits(userId, newBalance);
    
    return {
      success: true,
      newBalance,
      amountRefunded: creditCost
    };
  }

  async checkCredits(userId: string, serviceType: ServiceType): Promise<CreditCheckResult> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        currentCredits: 0,
        requiredCredits: SERVICE_CREDIT_COSTS[serviceType]
      };
    }
    
    // Check if user has unlimited plan for this service
    const unlimitedPlans = UNLIMITED_SERVICE_PLANS[serviceType];
    const userPlan = user.subscriptionPlan as PlanType;

    // Safety check: if service not found in unlimited plans, assume no unlimited access
    if (unlimitedPlans && unlimitedPlans.includes(userPlan)) {
      return {
        allowed: true,
        reason: 'unlimited',
        currentCredits: user.credits,
        requiredCredits: 0,
        planType: userPlan
      };
    }
    
    // Check if user has enough credits
    const creditCost = SERVICE_CREDIT_COSTS[serviceType];
    if (user.credits < creditCost) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        currentCredits: user.credits,
        requiredCredits: creditCost,
        planType: userPlan
      };
    }
    
    return {
      allowed: true,
      reason: 'success',
      currentCredits: user.credits,
      requiredCredits: creditCost,
      planType: userPlan
    };
  }

  async updateUserVocalPreference(userId: string, vocalGenderPreference: string): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        vocalGenderPreference,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result[0];
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result[0];
  }

  async resetDailyCredits(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || user.subscriptionPlan !== 'free') return;

    // Free tier: add 10 credits/day, but cap at 50
    // If user is at or above 50 credits, don't add daily credits
    if (user.credits < FREE_TIER_CREDIT_CAP) {
      const newCredits = Math.min(user.credits + FREE_TIER_DAILY_CREDITS, FREE_TIER_CREDIT_CAP);
      await this.updateUserCredits(userId, newCredits, new Date());
    } else {
      // Just update the reset timestamp
      await this.updateUserCredits(userId, user.credits, new Date());
    }
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    const result = await this.db
      .select()
      .from(quests)
      .where(eq(quests.userId, userId));

    return result;
  }

  async completeQuest(userId: string, questType: QuestType): Promise<{ success: boolean; creditsAwarded: number; error?: string }> {
    // Check if quest already completed
    const existingQuest = await this.db
      .select()
      .from(quests)
      .where(and(eq(quests.userId, userId), eq(quests.questType, questType)))
      .limit(1);

    if (existingQuest.length > 0 && existingQuest[0].completed === 1) {
      return {
        success: false,
        creditsAwarded: 0,
        error: 'Quest already completed'
      };
    }

    // Get user
    const user = await this.getUser(userId);
    if (!user) {
      return {
        success: false,
        creditsAwarded: 0,
        error: 'User not found'
      };
    }

    // Award credits
    const creditsToAward = QUEST_REWARDS[questType];
    const newBalance = user.credits + creditsToAward;

    // Update user credits
    await this.updateUserCredits(userId, newBalance);

    // Create or update quest record
    if (existingQuest.length > 0) {
      await this.db
        .update(quests)
        .set({
          completed: 1,
          creditsAwarded: creditsToAward,
          completedAt: new Date()
        })
        .where(and(eq(quests.userId, userId), eq(quests.questType, questType)));
    } else {
      await this.db
        .insert(quests)
        .values({
          userId,
          questType,
          completed: 1,
          creditsAwarded: creditsToAward,
          completedAt: new Date()
        });
    }

    return {
      success: true,
      creditsAwarded: creditsToAward
    };
  }

  async recordDailyLogin(userId: string): Promise<{ success: boolean; creditsAwarded: number; streak: number; firstLoginToday: boolean; error?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, creditsAwarded: 0, streak: 0, firstLoginToday: false, error: 'User not found' };
    }

    const now = new Date();
    const lastLogin = user.lastLoginAt;
    
    // Check if this is the first login today
    let firstLoginToday = true;
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
      
      if (today.getTime() === lastLoginDay.getTime()) {
        // Already logged in today
        firstLoginToday = false;
      }
    }

    if (!firstLoginToday) {
      return {
        success: true,
        creditsAwarded: 0,
        streak: user.dailyLoginStreak || 0,
        firstLoginToday: false
      };
    }

    // Calculate streak
    let newStreak = 1;
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
      
      if (yesterdayDay.getTime() === lastLoginDay.getTime()) {
        // Consecutive day
        newStreak = (user.dailyLoginStreak || 0) + 1;
      }
    }

    // Award credits (free tier only)
    let creditsAwarded = 0;
    let newBalance = user.credits;
    
    if (user.subscriptionPlan === 'free' && user.credits < FREE_TIER_CREDIT_CAP) {
      creditsAwarded = Math.min(FREE_TIER_DAILY_CREDITS, FREE_TIER_CREDIT_CAP - user.credits);
      newBalance = user.credits + creditsAwarded;
    }

    // Update user
    await this.db
      .update(users)
      .set({
        lastLoginAt: now,
        dailyLoginStreak: newStreak,
        credits: newBalance,
        updatedAt: now
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      creditsAwarded,
      streak: newStreak,
      firstLoginToday: true
    };
  }

  async createFeedEvent(event: InsertFeedEvent): Promise<FeedEvent> {
    const result = await this.db
      .insert(feedEvents)
      .values(event)
      .returning();
    
    return result[0];
  }

  async getFeedEvents(limit: number = 20, offset: number = 0): Promise<FeedEvent[]> {
    const result = await this.db
      .select()
      .from(feedEvents)
      .orderBy(desc(feedEvents.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result;
  }

  async getUserFeedEvents(userId: string, limit: number = 20): Promise<FeedEvent[]> {
    const result = await this.db
      .select()
      .from(feedEvents)
      .where(eq(feedEvents.userId, userId))
      .orderBy(desc(feedEvents.createdAt))
      .limit(limit);
    
    return result;
  }

  // ============================================================================
  // GHOSTMUSICIAN RPG IMPLEMENTATIONS
  // ============================================================================

  async createBand(band: InsertBand): Promise<Band> {
    const result = await this.db
      .insert(bands)
      .values(band)
      .returning();
    
    return result[0];
  }

  async getUserBands(userId: string): Promise<Band[]> {
    const result = await this.db
      .select()
      .from(bands)
      .where(eq(bands.userId, userId));
    
    return result;
  }

  async getAllBands(limit: number = 100): Promise<Band[]> {
    const result = await this.db
      .select()
      .from(bands)
      .orderBy(desc(bands.createdAt))
      .limit(limit);
    
    return result;
  }

  async getBand(bandId: string): Promise<Band | undefined> {
    const result = await this.db
      .select()
      .from(bands)
      .where(eq(bands.id, bandId))
      .limit(1);
    
    return result[0];
  }

  async updateBand(bandId: string, updates: Partial<Band>): Promise<Band | undefined> {
    const result = await this.db
      .update(bands)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bands.id, bandId))
      .returning();
    
    return result[0];
  }

  async deleteBand(bandId: string): Promise<boolean> {
    try {
      await this.db
        .delete(bands)
        .where(eq(bands.id, bandId));
      return true;
    } catch {
      return false;
    }
  }

  async applyDailyGrowth(userId: string, bandId: string): Promise<{
    success: boolean;
    band?: Band;
    growthApplied?: {
      fameGrowth: number;
      streamsAdded: number;
      digitalAdded: number;
      physicalAdded: number;
    };
    error?: string;
  }> {
    const band = await this.getBand(bandId);
    if (!band) {
      return { success: false, error: 'Band not found' };
    }

    if (band.userId !== userId) {
      return { success: false, error: 'Band does not belong to user' };
    }

    // Check if growth was already applied today
    if (band.lastGrowthApplied) {
      const lastGrowth = new Date(band.lastGrowthApplied);
      const now = new Date();
      const hoursSinceLastGrowth = (now.getTime() - lastGrowth.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastGrowth < 24) {
        return { success: false, error: 'Daily growth already applied today' };
      }
    }

    // Get user to check subscription tier
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Calculate growth based on FAME and tier multiplier
    const { FAME_GROWTH_MULTIPLIERS, ACHIEVEMENT_MILESTONES } = await import('#shared/schema');
    let tierMultiplier = FAME_GROWTH_MULTIPLIERS[user.subscriptionPlan as PlanType] || 1.0;
    
    // Check for manager and producer bonuses from inventory
    const inventory = await this.getUserInventory(userId);
    let managerMultiplier = 1.0;
    let producerMultiplier = 1.0;
    
    for (const item of inventory) {
      if (item.isActive) {
        // Fetch the product to get its productData
        const product = await this.getProduct(item.productId);
        if (product && product.productData) {
          const data = product.productData as any;
          // Manager provides experience/sales multiplier
          if (data.type === 'manager' && data.experienceMultiplier) {
            managerMultiplier = Math.max(managerMultiplier, data.experienceMultiplier);
          }
          // Producer provides FAME growth multiplier
          if (data.type === 'producer' && data.fameMultiplier) {
            producerMultiplier = Math.max(producerMultiplier, data.fameMultiplier);
          }
        }
      }
    }
    
    // Apply manager multiplier to tier multiplier (affects sales)
    tierMultiplier = tierMultiplier * managerMultiplier;
    
    // Check for achievement bonuses
    const achievements = await this.getBandAchievements(bandId);
    let achievementBonus = 0;
    
    const totalSales = band.physicalCopies + band.digitalDownloads + band.totalStreams;
    if (totalSales >= ACHIEVEMENT_MILESTONES.diamond.salesRequired) {
      achievementBonus = ACHIEVEMENT_MILESTONES.diamond.fameBonus;
    } else if (totalSales >= ACHIEVEMENT_MILESTONES.platinum.salesRequired) {
      achievementBonus = ACHIEVEMENT_MILESTONES.platinum.fameBonus;
    } else if (totalSales >= ACHIEVEMENT_MILESTONES.gold.salesRequired) {
      achievementBonus = ACHIEVEMENT_MILESTONES.gold.fameBonus;
    }

    // Apply producer multiplier to FAME growth
    const baseFameGrowth = tierMultiplier * (1 + achievementBonus) * producerMultiplier;
    const fameGrowth = Math.round(band.fame * 0.1 * baseFameGrowth); // 10% FAME growth per day, modified by tier, achievements, and producer
    
    // Calculate sales growth based on FAME (20x for streams, 1x for digital, 0.1x for physical)
    const streamsAdded = Math.round(band.fame * 20 * tierMultiplier);
    const digitalAdded = Math.round(band.fame * 1 * tierMultiplier);
    const physicalAdded = Math.round(band.fame * 0.1 * tierMultiplier);

    // Update band with growth
    const updatedBand = await this.updateBand(bandId, {
      fame: Math.min(band.fame + fameGrowth, 100), // Cap at 100
      totalStreams: band.totalStreams + streamsAdded,
      digitalDownloads: band.digitalDownloads + digitalAdded,
      physicalCopies: band.physicalCopies + physicalAdded,
      lastGrowthApplied: new Date(),
    });

    // Log the growth
    await this.db.insert(dailyGrowthLog).values({
      bandId,
      userId,
      fameGrowth,
      streamsAdded,
      digitalAdded,
      physicalAdded,
    });

    // Check and award new achievements
    await this.checkAndAwardAchievements(bandId);

    return {
      success: true,
      band: updatedBand,
      growthApplied: {
        fameGrowth,
        streamsAdded,
        digitalAdded,
        physicalAdded,
      },
    };
  }

  async checkAndAwardAchievements(bandId: string): Promise<BandAchievement[]> {
    const band = await this.getBand(bandId);
    if (!band) return [];

    const existingAchievements = await this.getBandAchievements(bandId);
    const existingTypes = new Set(existingAchievements.map(a => a.achievementType));
    
    const { ACHIEVEMENT_MILESTONES } = await import('#shared/schema');
    const totalSales = band.physicalCopies + band.digitalDownloads + band.totalStreams;
    
    const newAchievements: BandAchievement[] = [];

    // Check for Diamond
    if (totalSales >= ACHIEVEMENT_MILESTONES.diamond.salesRequired && !existingTypes.has('diamond')) {
      const result = await this.db
        .insert(bandAchievements)
        .values({ bandId, achievementType: 'diamond' })
        .returning();
      newAchievements.push(result[0]);
    }
    // Check for Platinum
    else if (totalSales >= ACHIEVEMENT_MILESTONES.platinum.salesRequired && !existingTypes.has('platinum')) {
      const result = await this.db
        .insert(bandAchievements)
        .values({ bandId, achievementType: 'platinum' })
        .returning();
      newAchievements.push(result[0]);
    }
    // Check for Gold
    else if (totalSales >= ACHIEVEMENT_MILESTONES.gold.salesRequired && !existingTypes.has('gold')) {
      const result = await this.db
        .insert(bandAchievements)
        .values({ bandId, achievementType: 'gold' })
        .returning();
      newAchievements.push(result[0]);
    }

    return newAchievements;
  }

  async getBandAchievements(bandId: string): Promise<BandAchievement[]> {
    const result = await this.db
      .select()
      .from(bandAchievements)
      .where(eq(bandAchievements.bandId, bandId));
    
    return result;
  }

  async deductRpgCredits(userId: string, serviceType: RpgServiceType): Promise<CreditDeductionResult> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return {
        success: false,
        newBalance: 0,
        amountDeducted: 0,
        wasUnlimited: false,
        error: 'User not found'
      };
    }
    
    // Check if user has enough credits
    const creditCost = RPG_CREDIT_COSTS[serviceType];
    if (user.credits < creditCost) {
      return {
        success: false,
        newBalance: user.credits,
        amountDeducted: 0,
        wasUnlimited: false,
        error: `Insufficient credits. Need ${creditCost}, have ${user.credits}`
      };
    }
    
    // Deduct credits
    const newBalance = user.credits - creditCost;
    await this.updateUserCredits(userId, newBalance);
    
    return {
      success: true,
      newBalance,
      amountDeducted: creditCost,
      wasUnlimited: false
    };
  }

  async checkRpgCredits(userId: string, serviceType: RpgServiceType): Promise<CreditCheckResult> {
    const user = await this.getUser(userId);
    
    if (!user) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        currentCredits: 0,
        requiredCredits: RPG_CREDIT_COSTS[serviceType]
      };
    }
    
    const creditCost = RPG_CREDIT_COSTS[serviceType];
    if (user.credits < creditCost) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        currentCredits: user.credits,
        requiredCredits: creditCost,
        planType: user.subscriptionPlan as PlanType
      };
    }
    
    return {
      allowed: true,
      reason: 'success',
      currentCredits: user.credits,
      requiredCredits: creditCost,
      planType: user.subscriptionPlan as PlanType
    };
  }

  async checkBandLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number | 'unlimited'; error?: string; }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { allowed: false, current: 0, limit: 0, error: 'User not found' };
    }

    const userBands = await this.getUserBands(userId);
    const current = userBands.length;
    const limit = BAND_LIMITS[user.subscriptionPlan as PlanType];

    if (limit === 'unlimited') {
      return { allowed: true, current, limit };
    }

    return {
      allowed: current < limit,
      current,
      limit,
      error: current >= limit ? `Band limit reached (${limit} bands)` : undefined
    };
  }

  // ============================================================================
  // CARD DESIGN OPERATIONS
  // ============================================================================

  async getOwnedCardDesigns(userId: string): Promise<string[]> {
    const result = await this.db
      .select()
      .from(ownedCardDesigns)
      .where(eq(ownedCardDesigns.userId, userId));
    
    // Everyone owns ghosts_online by default
    const owned = result.map(r => r.designId);
    if (!owned.includes('ghosts_online')) {
      owned.push('ghosts_online');
    }
    
    return owned;
  }

  async purchaseCardDesign(userId: string, designId: string, price: number): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    // Check if user already owns this design
    const owned = await this.getOwnedCardDesigns(userId);
    if (owned.includes(designId)) {
      return { success: false, error: 'You already own this card design' };
    }

    // Check user has enough credits
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.credits < price) {
      return {
        success: false,
        error: `Insufficient credits. Need ${price}, have ${user.credits}`
      };
    }

    try {
      // Deduct credits
      const updatedUser = await this.updateUserCredits(userId, user.credits - price);
      if (!updatedUser) {
        return { success: false, error: 'Failed to deduct credits' };
      }

      // Add design to owned
      await this.db.insert(ownedCardDesigns).values({
        userId,
        designId,
      });

      return {
        success: true,
        newBalance: updatedUser.credits
      };
    } catch (error) {
      console.error('Error purchasing card design:', error);
      return { success: false, error: 'Failed to purchase card design' };
    }
  }

  async equipCardDesign(bandId: string, designId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Get band to verify it exists and get userId
    const band = await this.getBand(bandId);
    if (!band) {
      return { success: false, error: 'Band not found' };
    }

    // Verify user owns this design
    const owned = await this.getOwnedCardDesigns(band.userId);
    if (!owned.includes(designId)) {
      return { success: false, error: 'You do not own this card design' };
    }

    // Update band's equipped design
    try {
      await this.updateBand(bandId, { equippedCardDesign: designId });
      return { success: true };
    } catch (error) {
      console.error('Error equipping card design:', error);
      return { success: false, error: 'Failed to equip card design' };
    }
  }
  
  // ============================================================================
  // MARKETPLACE OPERATIONS
  // ============================================================================
  
  async getProducts(category?: string): Promise<Product[]> {
    let query = this.db.select().from(products).where(eq(products.isActive, 1));
    
    if (category) {
      return await this.db.select().from(products)
        .where(and(eq(products.isActive, 1), eq(products.category, category)));
    }
    
    return await query;
  }
  
  async getProduct(productId: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products)
      .where(eq(products.id, productId))
      .limit(1);
    return result[0];
  }
  
  async getUserInventory(userId: string): Promise<UserInventory[]> {
    return await this.db.select().from(userInventory)
      .where(eq(userInventory.userId, userId));
  }
  
  async purchaseProduct(userId: string, productId: string, quantity: number = 1): Promise<{
    success: boolean;
    product?: Product;
    newBalance?: number;
    totalCost?: number;
    error?: string;
  }> {
    // Get product
    const product = await this.getProduct(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    // Check if product is active
    if (!product.isActive) {
      return { success: false, error: 'This product is no longer available' };
    }
    
    // Calculate total cost
    const totalCost = product.price * quantity;
    
    // Check user has enough credits
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (user.credits < totalCost) {
      return {
        success: false,
        error: `Insufficient credits. Need ${totalCost}, have ${user.credits}`
      };
    }
    
    // Check stock if limited
    if (product.stock !== null && product.stock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }
    
    try {
      // Deduct credits
      const updatedUser = await this.updateUserCredits(userId, user.credits - totalCost);
      if (!updatedUser) {
        return { success: false, error: 'Failed to deduct credits' };
      }
      
      // Check if user already owns this product (for stackable items)
      const inventory = await this.getUserInventory(userId);
      const existingItem = inventory.find(i => i.productId === productId);
      
      if (existingItem) {
        // Update quantity for stackable items
        await this.db.update(userInventory)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(userInventory.id, existingItem.id));
      } else {
        // Add new inventory item
        await this.db.insert(userInventory).values({
          userId,
          productId,
          quantity,
        });
      }
      
      // Decrease stock if limited
      if (product.stock !== null) {
        await this.db.update(products)
          .set({ stock: product.stock - quantity })
          .where(eq(products.id, productId));
      }
      
      // Special handling for card_themes: Also add to ownedCardDesigns
      if (product.category === 'card_themes' && product.productData) {
        try {
          const designId = (product.productData as any).designId;
          if (designId) {
            // Check if user already owns this design
            const ownedDesigns = await this.getOwnedCardDesigns(userId);
            if (!ownedDesigns.includes(designId)) {
              await this.db.insert(ownedCardDesigns).values({
                userId,
                designId,
              });
            }
          }
        } catch (error) {
          console.error('Error adding card design to owned:', error);
          // Don't fail the whole purchase if this fails
        }
      }
      
      return {
        success: true,
        product,
        newBalance: updatedUser.credits,
        totalCost
      };
    } catch (error) {
      console.error('Error purchasing product:', error);
      return { success: false, error: 'Failed to purchase product' };
    }
  }
}

// Use database storage when DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL
  ? new DbStorage()
  : new MemStorage();
