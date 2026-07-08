import { prisma } from '../lib/prisma';
import { stripe, stripeEnabled } from '../lib/stripe';
import { env } from '../config/env';
import { buildInvoiceNumber } from '../utils/money';
import type { Invoice } from '@prisma/client';

interface LineItem {
  description: string;
  quantity: number;
  unitAmount: number;
}

interface CreateInvoiceArgs {
  userId: string;
  clientId: string;
  projectId?: string | null;
  milestoneId?: string | null;
  currency: string;
  items: LineItem[];
  notes?: string;
  dueInDays?: number;
  autoSend?: boolean;
}

/** Generate the next sequential invoice number for a user. */
async function nextInvoiceNumber(userId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { userId } });
  return buildInvoiceNumber(count + 1);
}

/**
 * Create an invoice from line items. Computes totals, generates a payment link
 * (Stripe when configured, otherwise a mock link), and optionally sends it.
 */
export async function createInvoice(args: CreateInvoiceArgs): Promise<Invoice> {
  const subtotal = args.items.reduce(
    (sum, i) => sum + i.unitAmount * i.quantity,
    0,
  );
  const total = subtotal; // late fee added later by the reminder engine
  const number = await nextInvoiceNumber(args.userId);
  const dueInDays = args.dueInDays ?? 14;
  const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      number,
      userId: args.userId,
      clientId: args.clientId,
      projectId: args.projectId ?? null,
      milestoneId: args.milestoneId ?? null,
      currency: args.currency,
      subtotal,
      total,
      notes: args.notes,
      status: args.autoSend ? 'SENT' : 'DRAFT',
      issuedAt: args.autoSend ? new Date() : null,
      dueDate,
      items: {
        create: args.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitAmount: i.unitAmount,
          amount: i.unitAmount * i.quantity,
        })),
      },
    },
  });

  const paymentUrl = await createPaymentLink(invoice.id, total, args.currency, number);
  return prisma.invoice.update({
    where: { id: invoice.id },
    data: { paymentUrl },
    include: { items: true },
  });
}

/**
 * Create a hosted payment link. Uses Stripe Payment Links when configured;
 * otherwise returns a deterministic mock URL so the demo flow still works.
 */
export async function createPaymentLink(
  invoiceId: string,
  amount: number,
  currency: string,
  number: string,
): Promise<string> {
  if (stripeEnabled && stripe) {
    try {
      const price = await stripe.prices.create({
        currency: currency.toLowerCase(),
        unit_amount: amount * 100, // cents
        product_data: { name: `Invoice ${number}` },
      });
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: { invoiceId },
        after_completion: {
          type: 'redirect',
          redirect: { url: `${env.appPublicUrl}/pay/${invoiceId}/success` },
        },
      });
      return link.url;
    } catch (err) {
      console.error('[stripe] payment link failed, using mock:', (err as Error).message);
    }
  }
  // Mock link — points at the client portal pay page.
  return `${env.appPublicUrl}/pay/${invoiceId}`;
}

/** Mark an invoice paid and lower the client's risk score. */
export async function markInvoicePaid(invoiceId: string): Promise<Invoice> {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID', paidAt: new Date() },
  });
  await prisma.client.update({
    where: { id: invoice.clientId },
    data: { riskScore: { decrement: 5 } },
  }).catch(() => undefined);
  return invoice;
}
