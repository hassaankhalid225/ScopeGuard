import cron from 'node-cron';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { aiEnabled } from './lib/anthropic';
import { stripeEnabled } from './lib/stripe';
import { runReminders } from './services/reminderService';

async function main() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`\n  ScopeGuard API → http://localhost:${env.port}`);
    console.log(`  env: ${env.nodeEnv}`);
    console.log(`  AI engine: ${aiEnabled ? 'Claude (live)' : 'demo / heuristic mode'}`);
    console.log(`  Payments: ${stripeEnabled ? 'Stripe (live)' : 'demo / mock links'}\n`);
  });

  // Automated payment-reminder engine — runs every day at 09:00 server time.
  // (In dev you can also trigger it manually with `npm run reminders`.)
  const task = cron.schedule('0 9 * * *', async () => {
    try {
      const results = await runReminders();
      if (results.length) {
        console.log(`[reminders] processed ${results.length} overdue invoice(s)`);
      }
    } catch (err) {
      console.error('[reminders] job failed', err);
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down…`);
    task.stop();
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
