'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { money, formatDate } from '@/lib/format';

interface PortalProject {
  name: string;
  description: string | null;
  status: string;
  totalBudget: number;
  currency: string;
  revisionsLimit: number;
  clientApprovedAt: string | null;
  client: { name: string; company: string | null };
  user: { name: string };
  deliverables: { id: string; title: string }[];
  milestones: { id: string; title: string; percentage: number; amount: number; status: string }[];
}

export default function PortalProjectPage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<PortalProject | null>(null);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ project: PortalProject }>(`/portal/project/${token}`, { auth: false }).then((d) => {
      setProject(d.project);
      setApproved(Boolean(d.project.clientApprovedAt) || d.project.status === 'ACTIVE');
    });
  }, [token]);

  async function approve() {
    setBusy(true);
    await api(`/portal/project/${token}/approve`, { method: 'POST', auth: false });
    setApproved(true);
    setBusy(false);
  }

  return (
    <PortalShell>
      {!project ? (
        <div className="grid place-items-center py-20 text-jade-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-ink-600">{project.user.name} shared a project scope with you</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{project.name}</h1>
            {project.description && <p className="mt-2 text-ink-700">{project.description}</p>}
          </div>

          {approved && (
            <div className="rounded-xl bg-jade-50 px-4 py-3 text-sm font-medium text-jade-800">
              ✓ You’ve approved this scope. Work is underway.
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink">Deliverables</h2>
            <ul className="space-y-2 text-sm text-ink-700">
              {project.deliverables.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-jade-500" /> {d.title}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-600/70">Includes {project.revisionsLimit} round(s) of revisions.</p>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Payment schedule</h2>
              <span className="font-semibold text-ink">{money(project.totalBudget, project.currency)}</span>
            </div>
            <ul className="divide-y divide-ink-600/10 text-sm">
              {project.milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5">
                  <span className="text-ink-700">
                    {m.title} <span className="text-ink-600/60">· {m.percentage}%</span>
                  </span>
                  <span className="font-medium text-ink">{money(m.amount, project.currency)}</span>
                </li>
              ))}
            </ul>
          </div>

          {!approved && (
            <div className="card flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-ink-700">Does this scope look right? Approve it to get started.</p>
              <button onClick={approve} disabled={busy} className="btn-primary px-6 py-3">
                {busy ? <Spinner className="h-4 w-4" /> : 'Approve this scope'}
              </button>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  );
}
