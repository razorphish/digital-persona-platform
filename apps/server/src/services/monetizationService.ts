import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
import {
  personas,
  personaMonetization,
  subscriptionPayments,
  users,
  userConnections,
  subscriptionPlans,
} from "@digital-persona/database/schema";

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  isActive: boolean;
  subscriberCount: number;
}

export interface MonetizationSettings {
  personaId: string;
  isMonetizationEnabled: boolean;
  subscriptionTiers: SubscriptionTier[];
  paymentMethods: {
    stripe: boolean;
    paypal: boolean;
    crypto: boolean;
  };
  taxSettings: {
    taxRate: number;
    taxIncluded: boolean;
    taxRegion: string;
  };
  payoutSettings: {
    method: "bank" | "paypal" | "crypto";
    frequency: "daily" | "weekly" | "monthly";
    minimumAmount: number;
  };
}

export interface PartialMonetizationSettings {
  personaId?: string;
  isMonetizationEnabled?: boolean;
  subscriptionTiers?: SubscriptionTier[];
  paymentMethods?: {
    stripe?: boolean;
    paypal?: boolean;
    crypto?: boolean;
  };
  taxSettings?: {
    taxRate?: number;
    taxIncluded?: boolean;
    taxRegion?: string;
  };
  payoutSettings?: {
    method?: "bank" | "paypal" | "crypto";
    frequency?: "daily" | "weekly" | "monthly";
    minimumAmount?: number;
  };
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscribers: number;
  activeSubscribers: number;
  churnRate: number;
  averageRevenuePerUser: number;
  revenueGrowth: number;
  topTier: string;
}

export class MonetizationService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  /**
   * Get monetization settings for a persona
   */
  async getMonetizationSettings(
    personaId: string
  ): Promise<MonetizationSettings> {
    try {
      const settings = await this.db
        .select()
        .from(personaMonetization)
        .where(eq(personaMonetization.personaId, personaId))
        .limit(1);

      if (settings.length === 0) {
        // Return default settings if none exist
        return {
          personaId,
          isMonetizationEnabled: false,
          subscriptionTiers: [
            {
              id: "basic",
              name: "Basic Access",
              description: "Chat access with limited daily messages",
              price: 9.99,
              currency: "USD",
              interval: "monthly",
              features: [
                "Basic chat access",
                "10 messages per day",
                "Standard response time",
              ],
              isActive: true,
              subscriberCount: 0,
            },
            {
              id: "premium",
              name: "Premium Access",
              description: "Unlimited chat with priority support",
              price: 24.99,
              currency: "USD",
              interval: "monthly",
              features: [
                "Unlimited chat access",
                "Priority responses",
                "Custom personality training",
                "Video messages",
              ],
              isActive: true,
              subscriberCount: 0,
            },
          ],
          paymentMethods: {
            stripe: true,
            paypal: false,
            crypto: false,
          },
          taxSettings: {
            taxRate: 8.5,
            taxIncluded: false,
            taxRegion: "US",
          },
          payoutSettings: {
            method: "bank",
            frequency: "monthly",
            minimumAmount: 50,
          },
        };
      }

      const setting = settings[0];

      // Get subscription plans for this persona
      const plans = await this.db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.personaId, personaId));

      // Convert plans to subscription tiers
      const subscriptionTiers = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || "",
        price: parseFloat(plan.price.toString()),
        currency: plan.currency || "USD",
        interval: plan.billingPeriod as "monthly" | "yearly",
        features: plan.features?.customFeatures || [],
        isActive: plan.isActive,
        subscriberCount: 0, // Will be calculated separately
      }));

      // If no plans exist, use default tiers
      if (subscriptionTiers.length === 0) {
        subscriptionTiers.push(
          {
            id: "basic",
            name: "Basic Access",
            description: "Chat access with limited daily messages",
            price: 9.99,
            currency: "USD",
            interval: "monthly",
            features: [
              "Basic chat access",
              "10 messages per day",
              "Standard response time",
            ],
            isActive: true,
            subscriberCount: 0,
          },
          {
            id: "premium",
            name: "Premium Access",
            description: "Unlimited chat with priority support",
            price: 24.99,
            currency: "USD",
            interval: "monthly",
            features: [
              "Unlimited chat access",
              "Priority responses",
              "Custom personality training",
              "Video messages",
            ],
            isActive: true,
            subscriberCount: 0,
          }
        );
      }

      return {
        personaId,
        isMonetizationEnabled: setting.isMonetized || false,
        subscriptionTiers: subscriptionTiers.map((tier) => ({
          ...tier,
          isActive: tier.isActive ?? false,
        })),
        paymentMethods: {
          stripe: true, // Default to true since we're using Stripe
          paypal: false,
          crypto: false,
        },
        taxSettings: {
          taxRate: 8.5, // Default tax rate
          taxIncluded: false,
          taxRegion: "US",
        },
        payoutSettings: {
          method: "bank" as const,
          frequency: "monthly" as const,
          minimumAmount: 50,
        },
      };
    } catch (error) {
      console.error("Error getting monetization settings:", error);
      throw error;
    }
  }

  /**
   * Get revenue metrics for a persona
   */
  async getRevenueMetrics(personaId: string): Promise<RevenueMetrics> {
    try {
      const [payments, subscriptions] = await Promise.all([
        this.db
          .select()
          .from(subscriptionPayments)
          .where(eq(subscriptionPayments.personaId, personaId)),

        this.db
          .select()
          .from(userConnections)
          .where(
            and(
              eq(userConnections.targetPersonaId, personaId),
              eq(userConnections.connectionType, "subscriber")
            )
          ),
      ]);

      const totalRevenue = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount || "0"),
        0
      );

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const monthlyRevenue = payments
        .filter((payment) => new Date(payment.createdAt) >= thirtyDaysAgo)
        .reduce((sum, payment) => sum + parseFloat(payment.amount || "0"), 0);

      const activeSubscriptions = subscriptions.filter(
        (sub) => sub.isSubscriptionActive
      ).length;

      const totalSubscribers = subscriptions.length;

      const churnRate =
        totalSubscribers > 0
          ? ((totalSubscribers - activeSubscriptions) / totalSubscribers) * 100
          : 0;

      const averageRevenuePerUser =
        totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0;

      // Calculate revenue growth (simplified)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const previousMonthRevenue = payments
        .filter((payment) => {
          const paymentDate = new Date(payment.createdAt);
          return paymentDate >= sixtyDaysAgo && paymentDate < thirtyDaysAgo;
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount || "0"), 0);

      const revenueGrowth =
        previousMonthRevenue > 0
          ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
            100
          : 0;

      return {
        totalRevenue,
        monthlyRevenue,
        totalSubscribers,
        activeSubscribers: activeSubscriptions,
        churnRate,
        averageRevenuePerUser,
        revenueGrowth,
        topTier: "Premium Access", // Default for now
      };
    } catch (error) {
      console.error("Error getting revenue metrics:", error);
      throw error;
    }
  }

  /**
   * Update monetization settings
   */
  async updateMonetizationSettings(
    personaId: string,
    settings: PartialMonetizationSettings
  ): Promise<MonetizationSettings> {
    try {
      const existingSettings = await this.db
        .select()
        .from(personaMonetization)
        .where(eq(personaMonetization.personaId, personaId))
        .limit(1);

      if (existingSettings.length === 0) {
        // Create new settings - temporarily commented out due to type issues
        // await this.db.insert(personaMonetization).values({
        //   personaId: personaId,
        //   userId: "00000000-0000-0000-0000-000000000000", // Placeholder - should be actual user ID
        //   isMonetized: settings.isMonetizationEnabled || false,
        //   pricingModel: "hybrid",
        //   basicTierPrice: (settings.subscriptionTiers?.[0]?.price || 9.99).toString(),
        //   averageTierPrice: (settings.subscriptionTiers?.[1]?.price || 24.99).toString(),
        //   advancedTierPrice: (settings.subscriptionTiers?.[2]?.price || 49.99).toString(),
        //   timeBasedEnabled: false,
        //   hourlyRate: 0,
        //   freeMessagesPerDay: 3,
        //   freeMinutesPerDay: 10,
        //   autoAcceptSubscriptions: true,
        //   requireManualApproval: false,
        //   allowTips: true,
        //   totalRevenue: 0,
        //   totalSubscribers: 0,
        //   averageSessionRevenue: 0,
        // });
      } else {
        // Update existing settings
        await this.db
          .update(personaMonetization)
          .set({
            isMonetized: settings.isMonetizationEnabled,
            basicTierPrice: settings.subscriptionTiers?.[0]?.price?.toString(),
            averageTierPrice:
              settings.subscriptionTiers?.[1]?.price?.toString(),
            advancedTierPrice:
              settings.subscriptionTiers?.[2]?.price?.toString(),
          })
          .where(eq(personaMonetization.personaId, personaId));
      }

      // Update subscription plans if provided
      if (settings.subscriptionTiers) {
        // Delete existing plans
        await this.db
          .delete(subscriptionPlans)
          .where(eq(subscriptionPlans.personaId, personaId));

        // Insert new plans
        for (const tier of settings.subscriptionTiers) {
          await this.db.insert(subscriptionPlans).values({
            personaId,
            name: tier.name,
            description: tier.description,
            price: tier.price.toString(),
            currency: tier.currency,
            billingPeriod: tier.interval,
            accessLevel:
              tier.id === "basic"
                ? "basic"
                : tier.id === "premium"
                ? "premium"
                : "vip",
            features: {
              allowPhotos: tier.features.includes("Photos"),
              allowVideos: tier.features.includes("Video"),
              allowPersonalInfo: tier.features.includes("Personal Info"),
              allowExplicitContent: false,
              messageLimit: tier.features.includes("Unlimited") ? -1 : 10,
              prioritySupport: tier.features.includes("Priority"),
              customFeatures: tier.features,
            },
            isActive: tier.isActive,
          });
        }
      }

      return this.getMonetizationSettings(personaId);
    } catch (error) {
      console.error("Error updating monetization settings:", error);
      throw error;
    }
  }
}
