import Stripe from 'stripe';
import { env } from '../config/env';

/**
 * Stripe client. Optional — when no secret key is set the invoice service falls
 * back to a mock payment link so the rest of the flow still works in dev.
 */
export const stripe: Stripe | null = env.stripe.enabled
  ? new Stripe(env.stripe.secretKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion })
  : null;

export const stripeEnabled = env.stripe.enabled;
