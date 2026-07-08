import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

/**
 * Dashboard summary (PRD Stage 6): active projects, revenue tracker,
 * scope-creep score, client risk, and "earnings saved" from scope alerts.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;

    const [projects, invoices, scopeAlerts, clients] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: { client: { select: { name: true } }, milestones: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.invoice.findMany({ where: { userId }, include: { client: { select: { name: true } } } }),
      prisma.scopeAlert.findMany({ where: { project: { userId } } }),
      prisma.client.findMany({ where: { userId } }),
    ]);

    const earned = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    const pending = invoices
      .filter((i) => i.status === 'SENT' || i.status === 'DRAFT')
      .reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0);

    // "Earnings saved" = value of out-of-scope work caught this month.
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const savedThisMonth = scopeAlerts
      .filter((a) => a.verdict === 'OUT_OF_SCOPE' && a.createdAt >= monthStart)
      .reduce((s, a) => s + (a.estimatedCost ?? 0), 0);

    const outOfScopeCount = scopeAlerts.filter((a) => a.verdict === 'OUT_OF_SCOPE').length;

    const activeProjects = projects
      .filter((p) => p.status === 'ACTIVE' || p.status === 'AWAITING_APPROVAL')
      .map((p) => {
        const completed = p.milestones.filter((m) => m.status === 'COMPLETED').length;
        const total = p.milestones.length || 1;
        const nextMilestone = p.milestones.find((m) => m.status === 'PENDING');
        return {
          id: p.id,
          name: p.name,
          client: p.client.name,
          status: p.status,
          percentComplete: Math.round((completed / total) * 100),
          nextMilestone: nextMilestone?.title ?? null,
          currency: p.currency,
          totalBudget: p.totalBudget,
        };
      });

    const riskyClients = clients
      .filter((c) => c.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, riskScore: Math.min(100, c.riskScore) }));

    res.json({
      revenue: {
        earned,
        pending,
        overdue,
        currency: invoices[0]?.currency ?? 'USD',
      },
      counts: {
        activeProjects: activeProjects.length,
        totalProjects: projects.length,
        openInvoices: invoices.filter((i) => i.status !== 'PAID' && i.status !== 'VOID').length,
        clients: clients.length,
        scopeAlerts: scopeAlerts.length,
        outOfScopeCaught: outOfScopeCount,
      },
      scope: {
        savedThisMonth,
        outOfScopeCount,
        creepScore: scopeAlerts.length
          ? Math.round((outOfScopeCount / scopeAlerts.length) * 100)
          : 0,
      },
      activeProjects,
      riskyClients,
      recentInvoices: invoices
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          number: i.number,
          client: i.client.name,
          total: i.total,
          currency: i.currency,
          status: i.status,
          dueDate: i.dueDate,
        })),
    });
  }),
);

export default router;
