import { type User, type UpsertUser, type CreditCheckResult, type CreditDeductionResult, SERVICE_CREDIT_COSTS, UNLIMITED_SERVICE_PLANS, type ServiceType, type PlanType, users, quests, type Quest, type QuestType, QUEST_REWARDS, FREE_TIER_WELCOME_BONUS, FREE_TIER_DAILY_CREDITS, FREE_TIER_CREDIT_CAP } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import ws from "ws";

// Configure Neon for WebSocket
neonConfig.webSocketConstructor = ws;

// Storage interface for user and credit operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Credit operations
  updateUserCredits(userId: string, credits: number, lastCreditReset?: Date): Promise<User | undefined>;
  deductCredits(userId: string, serviceType: ServiceType): Promise<CreditDeductionResult>;
  checkCredits(userId: string, serviceType: ServiceType): Promise<CreditCheckResult>;
  resetDailyCredits(userId: string): Promise<void>; // Reset credits for free tier users (with 50 cap)
  // Quest operations
  getUserQuests(userId: string): Promise<Quest[]>;
  completeQuest(userId: string, questType: QuestType): Promise<{ success: boolean; creditsAwarded: number; error?: string }>;
  // User preference operations
  updateUserVocalPreference(userId: string, vocalGenderPreference: string): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
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
    
    if (unlimitedPlans.includes(userPlan)) {
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
    
    if (unlimitedPlans.includes(userPlan)) {
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
        vocalGenderPreference: userData.vocalGenderPreference || 'm',
        subscriptionPlan: userData.subscriptionPlan || 'free',
        credits: userData.credits ?? FREE_TIER_WELCOME_BONUS, // New users get 50 welcome bonus
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
    
    if (unlimitedPlans.includes(userPlan)) {
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
    
    if (unlimitedPlans.includes(userPlan)) {
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
}

// Use memory storage in development or when DATABASE_URL is not available
export const storage = process.env.DATABASE_URL && !process.env.NODE_ENV?.includes('development')
  ? new DbStorage()
  : new MemStorage();
