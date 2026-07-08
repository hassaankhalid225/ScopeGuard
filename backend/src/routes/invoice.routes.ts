import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { createInvoiceSchema } from '../schemas';
import { createInvoice, markInvoicePaid } from '../services/invoiceService';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.userId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { client: true, project: { select: { name: true } }, items: true },
    });
    res.json({ invoices });
  }),
);

router.post(
  '/',
  validate(createInvoiceSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof createInvoiceSchema.parse>;
    const client = await prisma.client.findFirst({
      where: { id: body.clientId, userId: req.userId },
    });
    if (!client) throw AppError.badRequest('Client not found');

    // Free plan limit from the PRD: 5 invoices / month.
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user?.plan === 'STARTER') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const count = await prisma.invoice.count({
        where: { userId: req.userId, createdAt: { gte: monthStart } },
      });
      if (count >= 5) {
        throw AppError.forbidden('Free plan is limited to 5 invoices/month. Upgrade to Pro for unlimited.');
      }
    }

    const invoice = await createInvoice({
      userId: req.userId!,
      clientId: body.clientId,
      projectId: body.projectId,
      currency: body.currency,
      notes: body.notes,
      dueInDays: body.dueInDays,
      autoSend: body.autoSend,
      items: body.items,
    });
    res.status(201).json({ invoice });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { client: true, items: true, project: { select: { name: true } } },
    });
    if (!invoice) throw AppError.notFound('Invoice not found');
    res.json({ invoice });
  }),
);

router.post(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw AppError.notFound('Invoice not found');
    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: { status: 'SENT', issuedAt: existing.issuedAt ?? new Date() },
    });
    res.json({ invoice });
  }),
);

router.post(
  '/:id/mark-paid',
  asyncHandler(async (req, res) => {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw AppError.notFound('Invoice not found');
    const invoice = await markInvoicePaid(existing.id);
    res.json({ invoice });
  }),
);

export default router;
