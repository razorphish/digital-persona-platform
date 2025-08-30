import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
import {
  userConnections,
  subscriptionPayments,
  personas,
  users,
  subscriptionPlans,
} from "@digital-persona/database/schema";

export interface Subscription {
  id: string;
  personaId: string;
  personaName: string;
  personaAvatarUrl?: string;
  subscriptionTier: string;
  amount: number;
  status: "active" | "canceled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account" | "paypal";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isExpired: boolean;
}

export class SubscriptionsService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      // Get user's subscriptions from userConnections table
      const subscriptions = await this.db
        .select({
          id: userConnections.id,
          personaId: userConnections.targetPersonaId,
          subscriptionTier: userConnections.subscriptionTier,
          status: userConnections.status,
          createdAt: userConnections.createdAt,
          updatedAt: userConnections.updatedAt,
        })
        .from(userConnections)
        .where(
          and(
            eq(userConnections.requesterId, userId),
            eq(userConnections.connectionType, "subscriber")
          )
        );

      // Get persona details for each subscription
      const subscriptionsWithPersonas = await Promise.all(
        subscriptions.map(async (sub) => {
          const persona = await this.db
            .select({
              id: personas.id,
              name: personas.name,
              avatarUrl: personas.avatar,
            })
            .from(personas)
            .where(eq(personas.id, sub.personaId))
            .limit(1);

          // Get subscription plan details
          const plan = await this.db
            .select({
              id: subscriptionPlans.id,
              name: subscriptionPlans.name,
              price: subscriptionPlans.price,
              currency: subscriptionPlans.currency,
            })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, sub.subscriptionTier || ""))
            .limit(1);

          // Get latest payment for this subscription
          const latestPayment = await this.db
            .select({
              id: subscriptionPayments.id,
              amount: subscriptionPayments.amount,
              status: subscriptionPayments.status,
              createdAt: subscriptionPayments.createdAt,
            })
            .from(subscriptionPayments)
            .where(eq(subscriptionPayments.subscriptionPlanId, sub.id))
            .orderBy(desc(subscriptionPayments.createdAt))
            .limit(1);

          return {
            id: sub.id,
            personaId: sub.personaId,
            personaName: persona[0]?.name || "Unknown Persona",
            personaAvatarUrl: persona[0]?.avatarUrl || undefined,
            subscriptionTier: plan[0]?.name || sub.subscriptionTier || "",
            amount:
              typeof plan[0]?.price === "string"
                ? parseFloat(plan[0].price)
                : plan[0]?.price || 0,
            status: sub.status as "active" | "canceled" | "past_due",
            currentPeriodStart: sub.createdAt,
            currentPeriodEnd: new Date(
              sub.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000
            ), // 30 days from start
            cancelAtPeriodEnd: false, // This would need to be tracked in the database
            stripeSubscriptionId: sub.id, // Using internal ID as placeholder
          };
        })
      );

      return subscriptionsWithPersonas;
    } catch (error) {
      console.error("Error getting user subscriptions:", error);
      throw error;
    }
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      // This would typically query a payment_methods table
      // For now, return empty array since we don't have this table yet
      return [];
    } catch (error) {
      console.error("Error getting user payment methods:", error);
      throw error;
    }
  }

  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean }> {
    try {
      // Update subscription status to canceled
      await this.db
        .update(userConnections)
        .set({
          status: "declined",
          updatedAt: new Date(),
        })
        .where(eq(userConnections.id, subscriptionId));

      return { success: true };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  }

  async reactivateSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean }> {
    try {
      // Update subscription status back to active
      await this.db
        .update(userConnections)
        .set({
          status: "accepted",
          updatedAt: new Date(),
        })
        .where(eq(userConnections.id, subscriptionId));

      return { success: true };
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw error;
    }
  }
}
