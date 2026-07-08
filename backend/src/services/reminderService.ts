import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { generateText, aiEnabled } from '../lib/anthropic';
import { formatMoney } from '../utils/money';

// Day-N cadence from the PRD: friendly → firm → final.
const REMINDER_DAYS = [1, 7, 14, 30] as const;

interface ReminderResult {
  invoiceId: string;
  number: string;
  day: number;
  tone: string;
  message: string;
  sent: boolean;
}

/**
 * The automated payment-reminder engine. Run on a schedule (cron / job).
 * Finds overdue SENT invoices and, for each Day-N threshold passed that hasn't
 * been actioned yet, drafts an escalating reminder (AI when available) and
 * "sends" it (logs / Resend when configured). Marks invoices OVERDUE.
 */
export async function runReminders(now = new Date()): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];

  const overdue = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'OVERDUE'] },
      dueDate: { lt: now },
    },
    include: { client: true, user: true },
  });

  for (const invoice of overdue) {
    if (!invoice.dueDate) continue;
    const daysPast = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (24 * 60 * 60 * 1000),
    );

    // Flip to OVERDUE the first time we see it past due.
    if (invoice.status !== 'OVERDUE') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });
      // Late payers get a higher risk score.
      await prisma.client
        .update({ where: { id: invoice.clientId }, data: { riskScore: { increment: 10 } } })
        .catch(() => undefined);
    }

    const dueThreshold = REMINDER_DAYS.filter(
      (d) => daysPast >= d && !invoice.remindersSent.includes(d),
    ).pop();

    if (dueThreshold == null) continue;

    const tone = toneFor(dueThreshold);
    const message = await draftReminder({
      tone,
      day: dueThreshold,
      number: invoice.number,
      amount: formatMoney(invoice.total, invoice.currency),
      clientName: invoice.client.name,
      freelancerName: invoice.user.name,
      paymentUrl: invoice.paymentUrl ?? `${env.appPublicUrl}/pay/${invoice.id}`,
    });

    const sent = await sendEmail(invoice.client.email, `Reminder: Invoice ${invoice.number}`, message);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { remindersSent: { push: dueThreshold } },
    });

    results.push({
      invoiceId: invoice.id,
      number: invoice.number,
      day: dueThreshold,
      tone,
      message,
      sent,
    });
  }

  return results;
}

function toneFor(day: number): string {
  if (day >= 30) return 'final-notice';
  if (day >= 14) return 'firm';
  if (day >= 7) return 'firm';
  return 'friendly';
}

interface DraftArgs {
  tone: string;
  day: number;
  number: string;
  amount: string;
  clientName: string;
  freelancerName: string;
  paymentUrl: string;
}

async function draftReminder(a: DraftArgs): Promise<string> {
  if (aiEnabled) {
    const system = [
      'You are ScopeGuard drafting a payment-reminder email a freelancer sends to a client.',
      `Tone: ${a.tone}. Keep it under 90 words, professional, and never rude.`,
      'For a "final-notice" tone, reference the contract terms and the option to escalate,',
      'while staying courteous. Always include the payment link.',
    ].join('\n');
    const user = JSON.stringify(a);
    const text = await generateText({ system, user, maxTokens: 600 });
    if (text) return text;
  }
  return fallbackReminder(a);
}

function fallbackReminder(a: DraftArgs): string {
  const intro: Record<string, string> = {
    friendly: `Hi ${a.clientName}, just a friendly reminder that invoice ${a.number} (${a.amount}) is now due.`,
    firm: `Hi ${a.clientName}, invoice ${a.number} (${a.amount}) is now ${a.day} days overdue. Per our agreement a late fee may apply.`,
    'final-notice': `Hi ${a.clientName}, this is a final notice for invoice ${a.number} (${a.amount}), now ${a.day} days overdue. As per our contract, continued non-payment may lead to escalation.`,
  };
  return `${intro[a.tone] ?? intro.friendly}\n\nYou can pay securely here: ${a.paymentUrl}\n\nThank you,\n${a.freelancerName}`;
}

/** Send an email via Resend when configured, otherwise log it (demo mode). */
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!env.email.enabled) {
    console.log(`\n[email:demo] → ${to}\nSubject: ${subject}\n${body}\n`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.email.from, to, subject, text: body }),
    });
    return res.ok;
  } catch (err) {
    console.error('[email] send failed:', (err as Error).message);
    return false;
  }
}
