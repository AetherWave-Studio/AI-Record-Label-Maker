import { type User, type UpsertUser, type CreditCheckResult, type CreditDeductionResult, SERVICE_CREDIT_COSTS, UNLIMITED_SERVICE_PLANS, type ServiceType, type PlanType, users } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
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
      credits: existingUser?.credits ?? userData.credits ?? 100,
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
        credits: userData.credits ?? 100,
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
}

// Export database storage instance instead of memory storage
export const storage = new DbStorage();
