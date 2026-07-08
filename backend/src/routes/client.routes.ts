import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { clientSchema } from '../schemas';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { projects: true, invoices: true } } },
    });
    res.json({ clients });
  }),
);

router.post(
  '/',
  validate(clientSchema),
  asyncHandler(async (req, res) => {
    const client = await prisma.client.create({
      data: { ...req.body, userId: req.userId! },
    });
    res.status(201).json({ client });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        projects: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!client) throw AppError.notFound('Client not found');
    res.json({ client });
  }),
);

router.patch(
  '/:id',
  validate(clientSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw AppError.notFound('Client not found');
    const client = await prisma.client.update({ where: { id: existing.id }, data: req.body });
    res.json({ client });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw AppError.notFound('Client not found');
    await prisma.client.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);

export default router;
