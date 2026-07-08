'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, StatusBadge, VerdictBadge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { money, formatDate } from '@/lib/format';
import type { Project, ScopeAlert } from '@/lib/types';

export default function ProjectDetailPage() {
  return (
    <AppShell>
      <ProjectDetail />
    </AppShell>
  );
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    api<{ project: Project }>(`/projects/${id}`).then((d) => setProject(d.project));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function completeMilestone(mid: string) {
    setBusyId(mid);
    try {
      await api(`/projects/${id}/milestones/${mid}/complete`, { method: 'POST' });
      setToast('Milestone completed — invoice generated & sent.');
      load();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  }

  async function requestApproval() {
    await api(`/projects/${id}/request-approval`, { method: 'POST' });
    setToast('Sent to client for approval.');
    load();
  }

  async function dismissAlert(alertId: string) {
    await api(`/projects/${id}/scope/${alertId}/dismiss`, { method: 'POST' });
    load();
  }

  async function createChangeOrder(alert: ScopeAlert) {
    await api(`/projects/${id}/change-orders`, {
      method: 'POST',
      body: {
        scopeAlertId: alert.id,
        title: `Change order — extra work`,
        description: alert.sourceText,
        extraHours: alert.estimatedHours ?? 0,
        extraCost: alert.estimatedCost ?? 0,
      },
    });
    setToast('Change order drafted from this alert.');
    load();
  }

  if (!project) {
    return (
      <div className="grid place-items-center py-20 text-jade-600">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const milestones = project.milestones ?? [];
  const completed = milestones.filter((m) => m.status === 'COMPLETED').length;
  const pct = Math.round((completed / (milestones.length || 1)) * 100);
  const portalUrl = `/portal/${project.portalToken}`;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-xl bg-jade-50 px-4 py-2.5 text-sm font-medium text-jade-800">{toast}</div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/projects" className="text-sm text-ink-600 hover:text-jade-700">
            ← Projects
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{project.name}</h1>
          <p className="text-ink-600">
            {project.client.name} {project.client.company ? `· ${project.client.company}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          {project.status === 'DRAFT' && (
            <button onClick={requestApproval} className="btn-outline">
              Send for approval
            </button>
          )}
          <Link href="/app/scope" className="btn-primary">
            Scope check
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: baseline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Budget" value={money(project.totalBudget, project.currency)} />
            <MiniStat label="Progress" value={`${pct}%`} />
            <MiniStat
              label="Revisions"
              value={`${project.revisionsUsed}/${project.revisionsLimit}`}
              warn={project.revisionsUsed >= project.revisionsLimit}
            />
            <MiniStat label="Due" value={formatDate(project.dueDate)} />
          </div>

          {project.description && (
            <div className="card p-5">
              <h2 className="mb-1 font-semibold text-ink">Scope summary</h2>
              <p className="text-sm text-ink-700">{project.description}</p>
            </div>
          )}

          {/* Milestones */}
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink">Payment milestones</h2>
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-600/10 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                        m.status === 'COMPLETED' ? 'bg-jade-100 text-jade-700' : 'bg-sand-100 text-ink-600'
                      }`}
                    >
                      {m.status === 'COMPLETED' ? '✓' : m.percentage + '%'}
                    </span>
                    <div>
                      <p className="font-medium text-ink">{m.title}</p>
                      <p className="text-xs text-ink-600">{money(m.amount, project.currency)}</p>
                    </div>
                  </div>
                  {m.status === 'COMPLETED' ? (
                    <span className="badge bg-jade-100 text-jade-800">Invoiced</span>
                  ) : (
                    <button onClick={() => completeMilestone(m.id)} className="btn-outline text-sm" disabled={busyId === m.id}>
                      {busyId === m.id ? <Spinner className="h-4 w-4" /> : 'Mark complete → invoice'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Deliverables */}
          {(project.deliverables ?? []).length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-ink">Deliverables</h2>
              <ul className="space-y-2 text-sm">
                {project.deliverables!.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-ink-700">
                    <span className={`h-2 w-2 rounded-full ${d.done ? 'bg-jade-500' : 'bg-sand-200'}`} />
                    {d.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: alerts + change orders + portal */}
        <div className="space-y-6">
          {/* Client portal link */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink">Client portal</h2>
            <p className="mt-1 text-sm text-ink-600">A read-only link for your client to review, approve & pay.</p>
            <Link href={portalUrl} target="_blank" className="btn-outline mt-3 w-full">
              Open portal ↗
            </Link>
          </div>

          {/* Scope alerts */}
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink">Scope alerts</h2>
            {(project.scopeAlerts ?? []).length === 0 ? (
              <p className="text-sm text-ink-600">No alerts. Run a scope check on any client request.</p>
            ) : (
              <ul className="space-y-3">
                {project.scopeAlerts!.map((a) => (
                  <li key={a.id} className="rounded-xl border border-ink-600/10 p-3">
                    <div className="flex items-center justify-between">
                      <VerdictBadge verdict={a.verdict} />
                      <span className="text-xs text-ink-600/60">{a.confidence}% sure</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-700">“{a.sourceText}”</p>
                    {a.estimatedCost ? (
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        +{a.estimatedHours}h · {money(a.estimatedCost, project.currency)}
                      </p>
                    ) : null}
                    {a.status === 'OPEN' && a.verdict !== 'IN_SCOPE' && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => createChangeOrder(a)} className="btn-primary px-3 py-1.5 text-xs">
                          Change order
                        </button>
                        <button onClick={() => dismissAlert(a.id)} className="btn-ghost px-3 py-1.5 text-xs">
                          Dismiss
                        </button>
                      </div>
                    )}
                    {a.status !== 'OPEN' && (
                      <p className="mt-2 text-xs text-ink-600/60">{a.status.toLowerCase()}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Change orders */}
          {(project.changeOrders ?? []).length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-ink">Change orders</h2>
              <ul className="space-y-2 text-sm">
                {project.changeOrders!.map((co) => (
                  <li key={co.id} className="rounded-xl border border-ink-600/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-ink">{co.title}</p>
                      <span className="badge bg-sand-100 text-ink-700">{co.status.toLowerCase()}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      +{co.extraHours}h · {money(co.extraCost, project.currency)}
                    </p>
                    {co.status === 'DRAFT' && (
                      <button
                        onClick={async () => {
                          await api(`/projects/${id}/change-orders/${co.id}/send`, { method: 'POST' });
                          setToast('Change order sent to client.');
                          load();
                        }}
                        className="btn-outline mt-2 w-full py-1.5 text-xs"
                      >
                        Send to client
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-ink-600">{label}</p>
      <p className={`mt-0.5 font-semibold ${warn ? 'text-red-600' : 'text-ink'}`}>{value}</p>
    </div>
  );
}
