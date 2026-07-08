import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@scopeguard.io';
  const passwordHash = await bcrypt.hash('password123', 12);

  // Reset demo account
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Ayesha Khan',
      freelancerType: 'DEVELOPER',
      niche: 'Full-stack web development',
      hourlyRate: 65,
      currency: 'USD',
      plan: 'PRO',
      onboardedAt: new Date(),
    },
  });

  const acme = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Daniel Carter',
      email: 'daniel@acmestudio.com',
      company: 'Acme Studio',
      riskScore: 0,
    },
  });

  const nimbus = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Priya Nair',
      email: 'priya@nimbus.io',
      company: 'Nimbus Labs',
      riskScore: 20,
    },
  });

  // Active project with baseline + milestones
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      clientId: acme.id,
      name: 'Acme Studio Marketing Site',
      description: 'A 5-page marketing website with a blog and contact form.',
      status: 'ACTIVE',
      totalBudget: 6000,
      currency: 'USD',
      revisionsLimit: 2,
      revisionsUsed: 1,
      startDate: new Date(),
      clientApprovedAt: new Date(),
      deliverables: {
        create: [
          { title: 'Homepage design + build', done: true },
          { title: 'About + Services pages' },
          { title: 'Blog with CMS' },
          { title: 'Contact form + integrations' },
        ],
      },
      milestones: {
        create: [
          { title: 'Upfront deposit', percentage: 30, amount: 1800, status: 'COMPLETED', completedAt: new Date(), order: 0 },
          { title: 'Design approval', percentage: 40, amount: 2400, order: 1 },
          { title: 'Final delivery', percentage: 30, amount: 1800, order: 2 },
        ],
      },
    },
  });

  // A scope alert that caught out-of-scope work
  await prisma.scopeAlert.create({
    data: {
      projectId: project.id,
      sourceText:
        'Hey! The site looks great. Can you also add a customer login portal and a dashboard where they can download invoices? Should be quick :)',
      verdict: 'OUT_OF_SCOPE',
      confidence: 92,
      reasoning:
        'A customer login portal and an invoice dashboard are net-new features not listed in the agreed deliverables (5 marketing pages + blog + contact form). This is additional development work.',
      suggestedReply:
        "Glad you love it! A customer login portal with an invoice dashboard is exciting — it's outside our current scope though, so I'll put together a quick change order with the extra hours and timeline. Once you approve it I'll get started right away.",
      estimatedHours: 18,
      estimatedCost: 1170,
      analysedByAi: false,
    },
  });

  // A paid + an overdue invoice
  await prisma.invoice.create({
    data: {
      number: 'SG-2026-0001',
      userId: user.id,
      clientId: acme.id,
      projectId: project.id,
      status: 'PAID',
      currency: 'USD',
      subtotal: 1800,
      total: 1800,
      issuedAt: new Date(Date.now() - 30 * 864e5),
      dueDate: new Date(Date.now() - 16 * 864e5),
      paidAt: new Date(Date.now() - 20 * 864e5),
      items: { create: [{ description: 'Acme Studio Marketing Site — Upfront deposit', quantity: 1, unitAmount: 1800, amount: 1800 }] },
    },
  });

  await prisma.invoice.create({
    data: {
      number: 'SG-2026-0002',
      userId: user.id,
      clientId: nimbus.id,
      status: 'OVERDUE',
      currency: 'USD',
      subtotal: 2200,
      total: 2200,
      issuedAt: new Date(Date.now() - 25 * 864e5),
      dueDate: new Date(Date.now() - 11 * 864e5),
      remindersSent: [1, 7],
      items: { create: [{ description: 'Nimbus Labs — Brand identity package', quantity: 1, unitAmount: 2200, amount: 2200 }] },
    },
  });

  // A draft project for the second client
  await prisma.project.create({
    data: {
      userId: user.id,
      clientId: nimbus.id,
      name: 'Nimbus Labs Rebrand',
      description: 'Logo, brand guidelines, and a one-page launch site.',
      status: 'AWAITING_APPROVAL',
      totalBudget: 4500,
      currency: 'USD',
      revisionsLimit: 3,
      deliverables: { create: [{ title: 'Logo concepts' }, { title: 'Brand guidelines' }, { title: 'Launch landing page' }] },
      milestones: {
        create: [
          { title: 'Kickoff deposit', percentage: 50, amount: 2250, order: 0 },
          { title: 'Final handoff', percentage: 50, amount: 2250, order: 1 },
        ],
      },
    },
  });

  console.log('Seed complete.');
  console.log('  Login →  demo@scopeguard.io  /  password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
