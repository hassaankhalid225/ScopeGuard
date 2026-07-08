import { Router, type Request, type Response } from 'express';
import { stripe } from '../lib/stripe';
import { env } from '../config/env';
import { markInvoicePaid } from '../services/invoiceService';

const router = Router();

/**
 * Stripe webhook. Mounted with `express.raw` (see app.ts) so the signature can
 * be verified against the raw body. Marks invoices paid on checkout completion.
 */
router.post('/stripe', async (req: Request, res: Response) => {
  if (!stripe || !env.stripe.webhookSecret) {
    return res.status(200).json({ received: true, note: 'stripe not configured' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature as string,
      env.stripe.webhookSecret,
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature error: ${(err as Error).message}`);
  }

  const type = event.type as string;
  if (type === 'checkout.session.completed' || type === 'payment_link.payment_succeeded') {
    const obj = event.data.object as { metadata?: { invoiceId?: string } };
    const invoiceId = obj.metadata?.invoiceId;
    if (invoiceId) {
      await markInvoicePaid(invoiceId).catch((e) =>
        console.error('[webhook] markInvoicePaid failed', e),
      );
    }
  }

  res.json({ received: true });
});

export default router;
