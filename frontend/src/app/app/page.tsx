'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { EmptyState, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { money, formatDate, relativeDays } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import type { DashboardData } from '@/lib/types';

export default function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-jade-600">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (!data) return null;

  const cur = data.revenue.currency;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-ink-600">Here’s your protection at a glance.</p>
        </div>
        <Link href="/app/projects/new" className="btn-primary">
          + New project
        </Link>
      </div>

      {/* Earnings saved highlight */}
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-ink p-6 text-white">
        <div>
          <p className="text-sm text-white/60">ScopeGuard saved you this month</p>
          <p className="mt-1 font-display text-4xl font-semibold text-jade-300">
            {money(data.scope.savedThisMonth, cur)}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {data.scope.outOfScopeCount} out-of-scope request{data.scope.outOfScopeCount === 1 ? '' : 's'} caught ·
            scope-creep score {data.scope.creepScore}%
          </p>
        </div>
        <Link href="/app/scope" className="btn-primary bg-jade-500 hover:bg-jade-400">
          Run a scope check
        </Link>
      </div>

      {/* Revenue + counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Earned" value={money(data.revenue.earned, cur)} tone="jade" />
        <Stat label="Pending" value={money(data.revenue.pending, cur)} tone="ink" />
        <Stat label="Overdue" value={money(data.revenue.overdue, cur)} tone="red" />
        <Stat label="Active projects" value={String(data.counts.activeProjects)} tone="ink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active projects */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Active projects</h2>
            <Link href="/app/projects" className="text-sm font-semibold text-jade-700 hover:underline">
              View all
            </Link>
          </div>
          {data.activeProjects.length === 0 ? (
            <EmptyState
              title="No active projects yet"
              description="Create your first project baseline to start protecting your scope."
              action={
                <Link href="/app/projects/new" className="btn-primary">
                  Create a project
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-600/10">
              {data.activeProjects.map((p) => (
                <li key={p.id} className="py-3">
                  <Link href={`/app/projects/${p.id}`} className="flex items-center justify-between gap-4 group">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink group-hover:text-jade-700">{p.name}</p>
                      <p className="text-sm text-ink-600">
                        {p.client} · next: {p.nextMilestone ?? 'complete'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden w-28 sm:block">
                        <div className="h-1.5 rounded-full bg-sand-100">
                          <div className="h-1.5 rounded-full bg-jade-500" style={{ width: `${p.percentComplete}%` }} />
                        </div>
                        <p className="mt-1 text-right text-xs text-ink-600">{p.percentComplete}%</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Risky clients */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink">Client risk</h2>
          {data.riskyClients.length === 0 ? (
            <p className="text-sm text-ink-600">No risk flags. Your clients pay on time 👏</p>
          ) : (
            <ul className="space-y-3">
              {data.riskyClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-ink-700">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-sand-100">
                      <div
                        className="h-1.5 rounded-full bg-red-500"
                        style={{ width: `${Math.min(100, c.riskScore)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-red-600">{c.riskScore}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Recent invoices</h2>
          <Link href="/app/invoices" className="text-sm font-semibold text-jade-700 hover:underline">
            View all
          </Link>
        </div>
        {data.recentInvoices.length === 0 ? (
          <p className="text-sm text-ink-600">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink-600/60">
                <tr>
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Due</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600/10">
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 pr-4 font-medium text-ink">{inv.number}</td>
                    <td className="py-2.5 pr-4 text-ink-700">{inv.client}</td>
                    <td className="py-2.5 pr-4 text-ink-600">
                      {formatDate(inv.dueDate)}{' '}
                      <span className="text-xs text-ink-600/60">{relativeDays(inv.dueDate)}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-ink">{money(inv.total, inv.currency)}</td>
                    <td className="py-2.5">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'jade' | 'ink' | 'red' }) {
  const color = { jade: 'text-jade-700', ink: 'text-ink', red: 'text-red-600' }[tone];
  return (
    <div className="card p-4">
      <p className="text-sm text-ink-600">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
