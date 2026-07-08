import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { loginSchema, registerSchema, updateProfileSchema } from '../schemas';

const router = Router();

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  freelancerType: string;
  niche: string | null;
  hourlyRate: number;
  currency: string;
  plan: string;
  onboardedAt: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    freelancerType: user.freelancerType,
    niche: user.niche,
    hourlyRate: user.hourlyRate,
    currency: user.currency,
    plan: user.plan,
    onboarded: Boolean(user.onboardedAt),
  };
}

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name, freelancerType, niche, hourlyRate, currency } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw AppError.conflict('An account with that email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        freelancerType: freelancerType ?? 'OTHER',
        niche,
        hourlyRate: hourlyRate ?? 50,
        currency: currency ?? 'USD',
      },
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    res.status(201).json({ user: publicUser(user), accessToken, refreshToken });
  }),
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.unauthorized('Invalid email or password');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw AppError.unauthorized('Invalid email or password');

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    res.json({ user: publicUser(user), accessToken, refreshToken });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) throw AppError.badRequest('refreshToken is required');
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw AppError.unauthorized('Account no longer exists');
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({ accessToken });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw AppError.notFound('User not found');
    res.json({ user: publicUser(user) });
  }),
);

router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { onboarded, ...rest } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...rest,
        ...(onboarded ? { onboardedAt: new Date() } : {}),
      },
    });
    res.json({ user: publicUser(user) });
  }),
);

export default router;
