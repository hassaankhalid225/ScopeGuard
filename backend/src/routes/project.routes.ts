import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import {
  analyzeScopeSchema,
  changeOrderSchema,
  createProjectSchema,
  deliverableSchema,
  updateProjectSchema,
} from '../schemas';
import { analyseScope } from '../services/scopeService';
import { createInvoice } from '../services/invoiceService';

const router = Router();
router.use(requireAuth);

const projectInclude = {
  client: true,
  deliverables: { orderBy: { createdAt: 'asc' } },
  milestones: { orderBy: { order: 'asc' } },
  scopeAlerts: { orderBy: { createdAt: 'desc' } },
  changeOrders: { orderBy: { createdAt: 'desc' } },
  invoices: { orderBy: { createdAt: 'desc' } },
} as const;

/** Resolve a project owned by the current user or throw 404. */
async function ownedProject(userId: string, id: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw AppError.notFound('Project not found');
  return project;
}

// ─── List & create ───────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        milestones: true,
        _count: { select: { scopeAlerts: true, invoices: true } },
      },
    });
    res.json({ projects });
  }),
);

router.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof createProjectSchema.parse>;

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, userId: req.userId },
    });
    if (!client) throw AppError.badRequest('Client not found');

    // Free plan limit from the PRD: 2 active projects.
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user?.plan === 'STARTER') {
      const active = await prisma.project.count({
        where: { userId: req.userId, status: { in: ['ACTIVE', 'AWAITING_APPROVAL'] } },
      });
      if (active >= 2) {
        throw AppError.forbidden('Free plan is limited to 2 active projects. Upgrade to Pro for unlimited.');
      }
    }

    const milestones = body.milestones.map((m, i) => ({
      title: m.title,
      percentage: m.percentage,
      amount: Math.round((body.totalBudget * m.percentage) / 100),
      dueDate: m.dueDate ? new Date(m.dueDate) : null,
      order: i,
    }));

    const project = await prisma.project.create({
      data: {
        userId: req.userId!,
        clientId: body.clientId,
        name: body.name,
        description: body.description,
        totalBudget: body.totalBudget,
        currency: body.currency,
        revisionsLimit: body.revisionsLimit,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'DRAFT',
        deliverables: { create: body.deliverables.map((title) => ({ title })) },
        milestones: { create: milestones },
      },
      include: projectInclude,
    });

    res.status(201).json({ project });
  }),
);

// ─── Read / update / delete ──────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: projectInclude,
    });
    res.json({ project });
  }),
);

router.patch(
  '/:id',
  validate(updateProjectSchema),
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const { dueDate, ...rest } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...rest, ...(dueDate ? { dueDate: new Date(dueDate) } : {}) },
      include: projectInclude,
    });
    res.json({ project });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

/** Send the baseline to the client for approval. */
router.post(
  '/:id/request-approval',
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'AWAITING_APPROVAL' },
      include: projectInclude,
    });
    res.json({ project, portalUrl: `/portal/${project.portalToken}` });
  }),
);

// ─── Deliverables ────────────────────────────────────────────────────────────

router.post(
  '/:id/deliverables',
  validate(deliverableSchema),
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const deliverable = await prisma.deliverable.create({
      data: { projectId: req.params.id, ...req.body },
    });
    res.status(201).json({ deliverable });
  }),
);

router.patch(
  '/:id/deliverables/:deliverableId',
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const deliverable = await prisma.deliverable.update({
      where: { id: req.params.deliverableId },
      data: { done: Boolean(req.body.done) },
    });
    res.json({ deliverable });
  }),
);

// ─── Milestones: complete → auto-invoice ─────────────────────────────────────

router.post(
  '/:id/milestones/:milestoneId/complete',
  asyncHandler(async (req, res) => {
    const project = await ownedProject(req.userId!, req.params.id);
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.milestoneId, projectId: project.id },
    });
    if (!milestone) throw AppError.notFound('Milestone not found');
    if (milestone.status === 'COMPLETED') {
      throw AppError.conflict('Milestone already completed');
    }

    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Auto-generate + send the invoice for this milestone (PRD Stage 3).
    const invoice = await createInvoice({
      userId: req.userId!,
      clientId: project.clientId,
      projectId: project.id,
      milestoneId: milestone.id,
      currency: project.currency,
      autoSend: true,
      items: [
        {
          description: `${project.name} — ${milestone.title}`,
          quantity: 1,
          unitAmount: milestone.amount,
        },
      ],
    });

    const updated = await prisma.project.findUnique({
      where: { id: project.id },
      include: projectInclude,
    });
    res.status(201).json({ project: updated, invoice });
  }),
);

// ─── Scope sentinel: analyse a client request ────────────────────────────────

router.post(
  '/:id/scope/analyze',
  validate(analyzeScopeSchema),
  asyncHandler(async (req, res) => {
    const project = await ownedProject(req.userId!, req.params.id);
    const [user, deliverables] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId } }),
      prisma.deliverable.findMany({ where: { projectId: project.id } }),
    ]);

    const analysis = await analyseScope(req.body.text, {
      projectName: project.name,
      description: project.description,
      deliverables: deliverables.map((d) => d.title),
      revisionsLimit: project.revisionsLimit,
      revisionsUsed: project.revisionsUsed,
      hourlyRate: user?.hourlyRate ?? 50,
      currency: project.currency,
    });

    const alert = await prisma.scopeAlert.create({
      data: {
        projectId: project.id,
        sourceText: req.body.text,
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        suggestedReply: analysis.suggestedReply,
        estimatedHours: analysis.estimatedHours,
        estimatedCost: analysis.estimatedCost,
        analysedByAi: analysis.analysedByAi,
      },
    });

    res.status(201).json({ alert });
  }),
);

router.post(
  '/:id/scope/:alertId/dismiss',
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const alert = await prisma.scopeAlert.update({
      where: { id: req.params.alertId },
      data: { status: 'DISMISSED' },
    });
    res.json({ alert });
  }),
);

// ─── Change orders ───────────────────────────────────────────────────────────

router.post(
  '/:id/change-orders',
  validate(changeOrderSchema),
  asyncHandler(async (req, res) => {
    const project = await ownedProject(req.userId!, req.params.id);
    const body = req.body as ReturnType<typeof changeOrderSchema.parse>;

    const changeOrder = await prisma.changeOrder.create({
      data: {
        projectId: project.id,
        scopeAlertId: body.scopeAlertId,
        title: body.title,
        description: body.description,
        extraHours: body.extraHours,
        extraCost: body.extraCost,
        status: 'DRAFT',
      },
    });

    if (body.scopeAlertId) {
      await prisma.scopeAlert
        .update({ where: { id: body.scopeAlertId }, data: { status: 'CONVERTED' } })
        .catch(() => undefined);
    }

    res.status(201).json({ changeOrder, approveUrl: `/portal/change-order/${changeOrder.approveToken}` });
  }),
);

router.post(
  '/:id/change-orders/:coId/send',
  asyncHandler(async (req, res) => {
    await ownedProject(req.userId!, req.params.id);
    const changeOrder = await prisma.changeOrder.update({
      where: { id: req.params.coId },
      data: { status: 'SENT' },
    });
    res.json({ changeOrder });
  }),
);

export default router;
