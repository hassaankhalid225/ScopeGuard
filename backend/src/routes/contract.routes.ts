import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { generateContractSchema } from '../schemas';
import { generateContract } from '../services/contractService';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const contracts = await prisma.contract.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { name: true } } },
    });
    res.json({ contracts });
  }),
);

router.post(
  '/generate',
  validate(generateContractSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof generateContractSchema.parse>;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw AppError.unauthorized();

    let clientName = 'Client';
    let clientCompany: string | null = null;
    let project: { name: string; totalBudget: number; currency: string; revisionsLimit: number } | null = null;

    if (body.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: body.clientId, userId: req.userId },
      });
      if (client) {
        clientName = client.name;
        clientCompany = client.company;
      }
    }
    if (body.projectId) {
      const p = await prisma.project.findFirst({
        where: { id: body.projectId, userId: req.userId },
        include: { client: true },
      });
      if (p) {
        project = { name: p.name, totalBudget: p.totalBudget, currency: p.currency, revisionsLimit: p.revisionsLimit };
        clientName = p.client.name;
        clientCompany = p.client.company;
      }
    }

    const generated = await generateContract({
      freelancerName: user.name,
      clientName,
      clientCompany,
      projectName: project?.name ?? body.title,
      brief: body.brief,
      template: body.template,
      jurisdiction: body.jurisdiction,
      totalBudget: project?.totalBudget,
      currency: project?.currency ?? user.currency,
      revisionsLimit: project?.revisionsLimit,
    });

    const contract = await prisma.contract.create({
      data: {
        userId: req.userId!,
        projectId: body.projectId,
        title: body.title,
        template: body.template,
        jurisdiction: body.jurisdiction,
        body: generated.body,
        generatedByAi: generated.generatedByAi,
        status: 'DRAFT',
      },
    });

    res.status(201).json({ contract });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const contract = await prisma.contract.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!contract) throw AppError.notFound('Contract not found');
    res.json({ contract });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.contract.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw AppError.notFound('Contract not found');
    const contract = await prisma.contract.update({
      where: { id: existing.id },
      data: { body: typeof req.body.body === 'string' ? req.body.body : existing.body },
    });
    res.json({ contract });
  }),
);

router.post(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const existing = await prisma.contract.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw AppError.notFound('Contract not found');
    const contract = await prisma.contract.update({
      where: { id: existing.id },
      data: { status: 'SENT' },
    });
    res.json({ contract, signUrl: `/portal/sign/${contract.signToken}` });
  }),
);

export default router;
