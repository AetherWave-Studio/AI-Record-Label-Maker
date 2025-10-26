import { type User, type UpsertUser } from "@shared/schema";

// Storage interface for user and credit operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Credit operations
  updateUserCredits(userId: string, credits: number): Promise<User | undefined>;
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
      subscriptionPlan: userData.subscriptionPlan || 'free',
      credits: existingUser?.credits ?? userData.credits ?? 100,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUserCredits(userId: string, credits: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    user.credits = credits;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }
}

export const storage = new MemStorage();
