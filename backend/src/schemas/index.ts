import { z } from 'zod';

const freelancerType = z.enum(['DESIGNER', 'DEVELOPER', 'WRITER', 'MARKETER', 'OTHER']);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1),
  freelancerType: freelancerType.optional(),
  niche: z.string().optional(),
  hourlyRate: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  freelancerType: freelancerType.optional(),
  niche: z.string().optional(),
  hourlyRate: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  plan: z.enum(['STARTER', 'PRO', 'AGENCY']).optional(),
  onboarded: z.boolean().optional(),
});

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Projects ────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  totalBudget: z.number().int().nonnegative().default(0),
  currency: z.string().length(3).default('USD'),
  revisionsLimit: z.number().int().nonnegative().default(2),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  deliverables: z.array(z.string().min(1)).default([]),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1),
        percentage: z.number().int().min(0).max(100),
        dueDate: z.string().datetime().optional(),
      }),
    )
    .default([]),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'AWAITING_APPROVAL', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  totalBudget: z.number().int().nonnegative().optional(),
  revisionsLimit: z.number().int().nonnegative().optional(),
  revisionsUsed: z.number().int().nonnegative().optional(),
  dueDate: z.string().datetime().optional(),
});

export const deliverableSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

// ─── Scope analysis ──────────────────────────────────────────────────────────

export const analyzeScopeSchema = z.object({
  text: z.string().min(3, 'Paste the client request to analyse'),
});

// ─── Change orders ───────────────────────────────────────────────────────────

export const changeOrderSchema = z.object({
  scopeAlertId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  extraHours: z.number().nonnegative().default(0),
  extraCost: z.number().int().nonnegative().default(0),
});

// ─── Invoices ────────────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  notes: z.string().optional(),
  dueInDays: z.number().int().positive().default(14),
  autoSend: z.boolean().default(false),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        unitAmount: z.number().int().nonnegative(),
      }),
    )
    .min(1, 'Add at least one line item'),
});

// ─── Contracts ───────────────────────────────────────────────────────────────

export const generateContractSchema = z.object({
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  title: z.string().min(1),
  brief: z.string().min(10, 'Provide a project brief to generate a contract'),
  template: z.enum(['web-dev', 'design', 'writing', 'marketing', 'general']).default('general'),
  jurisdiction: z.enum(['US', 'UK', 'EU', 'PK']).default('US'),
});

export const signContractSchema = z.object({
  signedByName: z.string().min(1),
});
