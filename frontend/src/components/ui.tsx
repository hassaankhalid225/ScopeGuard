'use client';

import { clsx } from '@/lib/clsx';
import type { InvoiceStatus, ProjectStatus, ScopeVerdict } from '@/lib/types';

export function Logo({ className = '', mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight', className)}>
      {mark && (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-jade-600 text-white shadow-sm">
          <ShieldIcon className="h-5 w-5" />
        </span>
      )}
      ScopeGuard
    </span>
  );
}

export function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.5l7 2.5v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V5l7-2.5z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 2.5l7 2.5v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V5l7-2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.7 11.8l2.2 2.2 4-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={clsx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const INVOICE_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-sand-100 text-ink-700',
  SENT: 'bg-blue-50 text-blue-700',
  PAID: 'bg-jade-100 text-jade-800',
  OVERDUE: 'bg-red-100 text-red-700',
  VOID: 'bg-sand-100 text-ink-600',
};

const PROJECT_STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'bg-sand-100 text-ink-700',
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-jade-100 text-jade-800',
  COMPLETED: 'bg-blue-50 text-blue-700',
  ARCHIVED: 'bg-sand-100 text-ink-600',
};

const VERDICT_STYLES: Record<ScopeVerdict, string> = {
  IN_SCOPE: 'bg-jade-100 text-jade-800',
  OUT_OF_SCOPE: 'bg-red-100 text-red-700',
  AMBIGUOUS: 'bg-amber-100 text-amber-800',
};

export function StatusBadge({ status }: { status: InvoiceStatus | ProjectStatus }) {
  const style =
    (INVOICE_STYLES as Record<string, string>)[status] ??
    (PROJECT_STYLES as Record<string, string>)[status] ??
    'bg-sand-100 text-ink-700';
  return <span className={clsx('badge', style)}>{status.replace(/_/g, ' ').toLowerCase()}</span>;
}

export function VerdictBadge({ verdict }: { verdict: ScopeVerdict }) {
  const label = { IN_SCOPE: 'In scope', OUT_OF_SCOPE: 'Out of scope', AMBIGUOUS: 'Ambiguous' }[verdict];
  return <span className={clsx('badge', VERDICT_STYLES[verdict])}>{label}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-sand-100 text-jade-600">
        <ShieldIcon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-600/70">{hint}</span>}
    </label>
  );
}
