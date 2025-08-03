/**
 * Stripe Service for Creator Payouts
 * 
 * Handles all Stripe operations including:
 * - Stripe Connect accounts for creators
 * - Subscription processing with 97/3 revenue split
 * - Time-based billing and one-time payments
 * - Automated creator payouts
 * - Webhook processing for payment events
 */

import Stripe from 'stripe';
import { db } from '@digital-persona/database';
import { 
  stripeAccounts, 
  subscriptionPayments, 
  creatorEarnings, 
  personaMonetization,
  users,
  personas 
} from '@digital-persona/database';
import { eq, and, desc, sum } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export interface CreateConnectAccountResult {
  success: boolean;
  accountId: string;
  onboardingUrl: string;
  errors?: string[];
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  clientSecret?: string;
  error?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: Stripe.Subscription;
  clientSecret?: string;
  error?: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  amount?: number;
  error?: string;
}

export class StripeService {
  private stripe: Stripe;
  private platformFeePercentage = 0.03; // 3% platform fee
  private creatorPercentage = 0.97; // 97% to creator

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a Stripe Connect Express account for a creator
   */
  async createConnectAccount(
    userId: string,
    verificationId: string,
    email: string,
    country: string = 'US'
  ): Promise<CreateConnectAccountResult> {
    try {
      // Check if user already has a Stripe account
      const existingAccount = await db
        .select()
        .from(stripeAccounts)
        .where(eq(stripeAccounts.userId, userId))
        .limit(1);

      if (existingAccount.length > 0) {
        const account = existingAccount[0];
        
        // If onboarding is not complete, return existing onboarding URL
        if (!account.onboardingCompletedAt && account.onboardingUrl) {
          return {
            success: true,
            accountId: account.stripeAccountId,
            onboardingUrl: account.onboardingUrl
          };
        }
      }

      // Create new Stripe Connect Express account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'friday'
            }
          }
        }
      });

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/creator/verification/refresh`,
        return_url: `${process.env.FRONTEND_URL}/creator/verification/complete`,
        type: 'account_onboarding',
      });

      // Save to database
      const [savedAccount] = await db
        .insert(stripeAccounts)
        .values({
          userId,
          verificationId,
          stripeAccountId: account.id,
          stripeAccountType: 'express',
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          onboardingUrl: accountLink.url,
          onboardingExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          defaultCurrency: 'usd',
          isActive: true
        })
        .returning();

      return {
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url
      };

    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      return {
        success: false,
        accountId: '',
        onboardingUrl: '',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create a subscription for a persona with revenue splitting
   */
  async createSubscription(
    payerId: string,
    creatorId: string,
    personaId: string,
    priceId: string,
    tierType: 'basic' | 'average' | 'advanced'
  ): Promise<SubscriptionResult> {
    try {
      // Get creator's Stripe account
      const creatorAccount = await this.getCreatorStripeAccount(creatorId);
      if (!creatorAccount) {
        throw new Error('Creator has not set up payments');
      }

      // Get persona pricing
      const personaPricing = await this.getPersonaMonetization(personaId);
      if (!personaPricing) {
        throw new Error('Persona monetization not configured');
      }

      // Get the price based on tier
      const tierPrice = this.getTierPrice(personaPricing, tierType);
      if (!tierPrice) {
        throw new Error('Pricing tier not configured');
      }

      // Calculate fees
      const totalAmount = tierPrice;
      const platformFee = Math.round(totalAmount * this.platformFeePercentage);
      const creatorAmount = totalAmount - platformFee;

      // Create or get Stripe customer
      const customer = await this.getOrCreateStripeCustomer(payerId);

      // Create the subscription with application fee
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tierType} tier - Persona subscription`,
                description: `Access to persona with ${tierType} tier features`,
              },
              unit_amount: totalAmount * 100, // Convert to cents
              recurring: {
                interval: 'month',
              },
            },
          },
        ],
        application_fee_percent: this.platformFeePercentage * 100,
        transfer_data: {
          destination: creatorAccount.stripeAccountId,
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription' 
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save payment record
      await this.saveSubscriptionPayment({
        payerId,
        creatorId,
        personaId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        paymentType: 'subscription',
        amount: totalAmount,
        creatorAmount,
        platformAmount: platformFee,
        status: 'pending',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

      return {
        success: true,
        subscription,
        clientSecret: paymentIntent.client_secret || undefined
      };

    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a time-based payment for a conversation session
   */
  async createTimeBasedPayment(
    payerId: string,
    creatorId: string,
    personaId: string,
    sessionMinutes: number,
    hourlyRate: number
  ): Promise<PaymentIntentResult> {
    try {
      // Get creator's Stripe account
      const creatorAccount = await this.getCreatorStripeAccount(creatorId);
      if (!creatorAccount) {
        throw new Error('Creator has not set up payments');
      }

      // Calculate payment amounts
      const totalAmount = Math.round((sessionMinutes / 60) * hourlyRate * 100) / 100; // Round to cents
      const platformFee = Math.round(totalAmount * this.platformFeePercentage);
      const creatorAmount = totalAmount - platformFee;

      // Create or get Stripe customer
      const customer = await this.getOrCreateStripeCustomer(payerId);

      // Create payment intent with application fee
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        application_fee_amount: platformFee * 100,
        transfer_data: {
          destination: creatorAccount.stripeAccountId,
        },
        description: `${sessionMinutes} minutes conversation with persona`,
        metadata: {
          payerId,
          creatorId,
          personaId,
          sessionMinutes: sessionMinutes.toString(),
          hourlyRate: hourlyRate.toString(),
          paymentType: 'time_based'
        }
      });

      // Save payment record
      await this.saveSubscriptionPayment({
        payerId,
        creatorId,
        personaId,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        paymentType: 'time_based',
        amount: totalAmount,
        creatorAmount,
        platformAmount: platformFee,
        sessionMinutes,
        hourlyRate,
        status: 'pending'
      });

      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret || undefined
      };

    } catch (error) {
      console.error('Error creating time-based payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process webhook events from Stripe
   */
  async processWebhook(body: string, signature: string): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSuccess(event.data.object as Stripe.Invoice);
          break;
        
        case 'account.updated':
          await this.handleAccountUpdate(event.data.object as Stripe.Account);
          break;
        
        case 'payout.paid':
          await this.handlePayoutCompleted(event.data.object as Stripe.Payout);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Calculate and create payouts for creators
   */
  async processCreatorPayouts(): Promise<void> {
    try {
      // Get all creators with pending earnings
      const creatorAccounts = await db
        .select()
        .from(stripeAccounts)
        .where(and(
          eq(stripeAccounts.isActive, true),
          eq(stripeAccounts.payoutsEnabled, true)
        ));

      for (const account of creatorAccounts) {
        await this.processCreatorPayout(account.userId, account.stripeAccountId);
      }

    } catch (error) {
      console.error('Error processing creator payouts:', error);
    }
  }

  // Private helper methods

  private async getCreatorStripeAccount(userId: string) {
    const result = await db
      .select()
      .from(stripeAccounts)
      .where(and(
        eq(stripeAccounts.userId, userId),
        eq(stripeAccounts.isActive, true)
      ))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  private async getPersonaMonetization(personaId: string) {
    const result = await db
      .select()
      .from(personaMonetization)
      .where(eq(personaMonetization.personaId, personaId))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  private getTierPrice(personaPricing: any, tierType: string): number | null {
    switch (tierType) {
      case 'basic':
        return parseFloat(personaPricing.basicTierPrice || '0');
      case 'average':
        return parseFloat(personaPricing.averageTierPrice || '0');
      case 'advanced':
        return parseFloat(personaPricing.advancedTierPrice || '0');
      default:
        return null;
    }
  }

  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    // Get user info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const userData = user[0];

    // Check if customer already exists
    const customers = await this.stripe.customers.list({
      email: userData.email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return await this.stripe.customers.create({
      email: userData.email,
      name: userData.name,
      metadata: {
        userId: userId
      }
    });
  }

  private async saveSubscriptionPayment(paymentData: any) {
    await db
      .insert(subscriptionPayments)
      .values({
        payerId: paymentData.payerId,
        creatorId: paymentData.creatorId,
        personaId: paymentData.personaId,
        stripePaymentIntentId: paymentData.stripePaymentIntentId,
        stripeSubscriptionId: paymentData.stripeSubscriptionId,
        stripeCustomerId: paymentData.stripeCustomerId,
        paymentType: paymentData.paymentType,
        amount: paymentData.amount.toString(),
        creatorAmount: paymentData.creatorAmount.toString(),
        platformAmount: paymentData.platformAmount.toString(),
        currency: 'USD',
        status: paymentData.status,
        sessionMinutes: paymentData.sessionMinutes,
        hourlyRate: paymentData.hourlyRate?.toString(),
        billingPeriodStart: paymentData.billingPeriodStart,
        billingPeriodEnd: paymentData.billingPeriodEnd
      });
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Update payment status
    await db
      .update(subscriptionPayments)
      .set({
        status: 'succeeded',
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptionPayments.stripePaymentIntentId, paymentIntent.id));

    // Update creator earnings
    await this.updateCreatorEarnings(paymentIntent);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    await db
      .update(subscriptionPayments)
      .set({
        status: 'failed',
        failureCode: paymentIntent.last_payment_error?.code || null,
        failureMessage: paymentIntent.last_payment_error?.message || null,
        failedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptionPayments.stripePaymentIntentId, paymentIntent.id));
  }

  private async handleInvoicePaymentSuccess(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      await db
        .update(subscriptionPayments)
        .set({
          status: 'succeeded',
          stripeInvoiceId: invoice.id,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(subscriptionPayments.stripeSubscriptionId, invoice.subscription.toString()));
    }
  }

  private async handleAccountUpdate(account: Stripe.Account) {
    // Update account capabilities and requirements
    await db
      .update(stripeAccounts)
      .set({
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        capabilities: account.capabilities || {},
        requirements: account.requirements || {},
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
        lastWebhookAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(stripeAccounts.stripeAccountId, account.id));
  }

  private async handlePayoutCompleted(payout: Stripe.Payout) {
    // Update creator earnings with payout information
    await db
      .update(creatorEarnings)
      .set({
        payoutStatus: 'paid',
        payoutId: payout.id,
        payoutDate: new Date(payout.arrival_date * 1000),
        payoutAmount: (payout.amount / 100).toString(),
        updatedAt: new Date()
      })
      .where(eq(creatorEarnings.payoutId, payout.id));
  }

  private async updateCreatorEarnings(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata;
    if (!metadata.creatorId) return;

    const creatorId = metadata.creatorId;
    const amount = paymentIntent.amount / 100; // Convert from cents
    const creatorAmount = amount * this.creatorPercentage;
    const platformFee = amount * this.platformFeePercentage;

    // TODO: Implement earnings aggregation logic
    console.log(`Creator ${creatorId} earned $${creatorAmount} from payment ${paymentIntent.id}`);
  }

  private async processCreatorPayout(userId: string, stripeAccountId: string): Promise<PayoutResult> {
    try {
      // Calculate pending earnings for the creator
      // This would typically aggregate from a recent period
      const pendingAmount = await this.calculatePendingEarnings(userId);

      if (pendingAmount <= 0) {
        return { success: true, amount: 0 };
      }

      // Create payout
      const payout = await this.stripe.payouts.create({
        amount: Math.round(pendingAmount * 100), // Convert to cents
        currency: 'usd',
        description: 'Creator earnings payout',
        metadata: {
          userId: userId
        }
      }, {
        stripeAccount: stripeAccountId
      });

      return {
        success: true,
        payoutId: payout.id,
        amount: pendingAmount
      };

    } catch (error) {
      console.error(`Error processing payout for creator ${userId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async calculatePendingEarnings(userId: string): Promise<number> {
    // This would calculate earnings from the last payout period
    // For now, return a placeholder
    return 0;
  }
}