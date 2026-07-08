/** Manual entrypoint to run the payment-reminder engine once (e.g. via cron). */
import { prisma } from '../lib/prisma';
import { runReminders } from '../services/reminderService';

async function main() {
  const results = await runReminders();
  console.log(`Processed ${results.length} reminder(s):`);
  for (const r of results) {
    console.log(`  • ${r.number} — day ${r.day} (${r.tone}) ${r.sent ? 'sent' : 'logged'}`);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
