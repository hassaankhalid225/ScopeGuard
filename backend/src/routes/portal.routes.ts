import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import { signContractSchema } from '../schemas';
import { markInvoicePaid } from '../services/invoiceService';

/**
 * Public, token-authenticated client portal (PRD Stage 5).
 * Clients never log in — they reach these routes via a secure link.
 */
const router = Router();

// ─── Project scope review + approval ─────────────────────────────────────────

router.get(
  '/project/:token',
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { portalToken: req.params.token },
      include: {
        client: { select: { name: true, company: true } },
        user: { select: { name: true } },
        deliverables: { orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { order: 'asc' } },
      },
    });
    if (!project) throw AppError.notFound('Project not found');
    res.json({ project });
  }),
);

router.post(
  '/project/:token/approve',
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { portalToken: req.params.token } });
    if (!project) throw AppError.notFound('Project not found');
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: 'ACTIVE', clientApprovedAt: new Date() },
    });
    res.json({ ok: true, status: updated.status });
  }),
);

// ─── Contract signing ────────────────────────────────────────────────────────

router.get(
  '/sign/:token',
  asyncHandler(async (req, res) => {
    const contract = await prisma.contract.findUnique({
      where: { signToken: req.params.token },
      include: { user: { select: { name: true } } },
    });
    if (!contract) throw AppError.notFound('Contract not found');
    res.json({ contract });
  }),
);

router.post(
  '/sign/:token',
  validate(signContractSchema),
  asyncHandler(async (req, res) => {
    const contract = await prisma.contract.findUnique({ where: { signToken: req.params.token } });
    if (!contract) throw AppError.notFound('Contract not found');
    if (contract.status === 'SIGNED') throw AppError.conflict('Contract already signed');
    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: { status: 'SIGNED', signedByName: req.body.signedByName, signedAt: new Date() },
    });
    res.json({ ok: true, signedAt: updated.signedAt });
  }),
);

// ─── Change-order approval ───────────────────────────────────────────────────

router.get(
  '/change-order/:token',
  asyncHandler(async (req, res) => {
    const co = await prisma.changeOrder.findUnique({
      where: { approveToken: req.params.token },
      include: { project: { select: { name: true, currency: true } } },
    });
    if (!co) throw AppError.notFound('Change order not found');
    res.json({ changeOrder: co });
  }),
);

router.post(
  '/change-order/:token/respond',
  asyncHandler(async (req, res) => {
    const accept = req.body?.accept === true;
    const co = await prisma.changeOrder.findUnique({ where: { approveToken: req.params.token } });
    if (!co) throw AppError.notFound('Change order not found');

    const updated = await prisma.changeOrder.update({
      where: { id: co.id },
      data: { status: accept ? 'ACCEPTED' : 'REJECTED', respondedAt: new Date() },
    });

    // On acceptance, grow the project budget by the extra cost (PRD Stage 4).
    if (accept) {
      await prisma.project.update({
        where: { id: co.projectId },
        data: { totalBudget: { increment: co.extraCost } },
      });
    }
    res.json({ ok: true, status: updated.status });
  }),
);

// ─── Invoice view + pay ──────────────────────────────────────────────────────

router.get(
  '/invoice/:id',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        client: { select: { name: true, company: true } },
        user: { select: { name: true } },
      },
    });
    if (!invoice) throw AppError.notFound('Invoice not found');
    res.json({ invoice });
  }),
);

// Demo "pay now" — in production this is handled by the Stripe webhook.
router.post(
  '/invoice/:id/pay',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw AppError.notFound('Invoice not found');
    if (invoice.status === 'PAID') return res.json({ ok: true, alreadyPaid: true });
    await markInvoicePaid(invoice.id);
    res.json({ ok: true });
  }),
);

export default router;
