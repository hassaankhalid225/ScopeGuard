'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Client } from '@/lib/types';

interface MilestoneDraft {
  title: string;
  percentage: number;
}

export default function NewProjectPage() {
  return (
    <AppShell>
      <NewProject />
    </AppShell>
  );
}

function NewProject() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    clientId: '',
    name: '',
    description: '',
    totalBudget: 5000,
    currency: 'USD',
    revisionsLimit: 2,
    dueDate: '',
  });
  const [deliverables, setDeliverables] = useState<string[]>(['']);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: 'Upfront deposit', percentage: 30 },
    { title: 'Mid-project', percentage: 40 },
    { title: 'Final delivery', percentage: 30 },
  ]);

  useEffect(() => {
    api<{ clients: Client[] }>('/clients').then((d) => {
      setClients(d.clients);
      if (d.clients[0]) setForm((f) => ({ ...f, clientId: d.clients[0].id }));
    });
  }, []);

  const milestoneTotal = milestones.reduce((s, m) => s + Number(m.percentage || 0), 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.clientId) return setError('Please add and select a client first.');
    if (milestoneTotal !== 100) return setError(`Milestones must add up to 100% (currently ${milestoneTotal}%).`);

    setBusy(true);
    try {
      const { project } = await api<{ project: { id: string } }>('/projects', {
        method: 'POST',
        body: {
          clientId: form.clientId,
          name: form.name,
          description: form.description || undefined,
          totalBudget: Number(form.totalBudget),
          currency: form.currency,
          revisionsLimit: Number(form.revisionsLimit),
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          deliverables: deliverables.map((d) => d.trim()).filter(Boolean),
          milestones: milestones
            .filter((m) => m.title.trim())
            .map((m) => ({ title: m.title, percentage: Number(m.percentage) })),
        },
      });
      router.push(`/app/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create project');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/app/projects" className="text-sm text-ink-600 hover:text-jade-700">
          ← Projects
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">New project baseline</h1>
        <p className="text-ink-600">Define the scope once — ScopeGuard protects it from then on.</p>
      </div>

      {clients.length === 0 && (
        <div className="card flex items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">You need a client before creating a project.</p>
          <Link href="/app/clients" className="btn-outline">
            Add a client
          </Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold text-ink">Project details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Client</span>
              <select
                className="input"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `· ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Project name</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Marketing site redesign"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="label">Description / scope summary</span>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="A 5-page marketing website with a blog and contact form."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="label">Total budget</span>
              <input
                className="input"
                type="number"
                min={0}
                value={form.totalBudget}
                onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="label">Currency</span>
              <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {['USD', 'EUR', 'GBP', 'PKR'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Revisions included</span>
              <input
                className="input"
                type="number"
                min={0}
                value={form.revisionsLimit}
                onChange={(e) => setForm({ ...form, revisionsLimit: Number(e.target.value) })}
              />
            </label>
          </div>
        </section>

        {/* Deliverables */}
        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Deliverables</h2>
            <button type="button" className="btn-ghost text-sm" onClick={() => setDeliverables([...deliverables, ''])}>
              + Add
            </button>
          </div>
          {deliverables.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                value={d}
                placeholder={`Deliverable ${i + 1}`}
                onChange={(e) => setDeliverables(deliverables.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {deliverables.length > 1 && (
                <button
                  type="button"
                  className="btn-ghost px-3 text-ink-600"
                  onClick={() => setDeliverables(deliverables.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </section>

        {/* Milestones */}
        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Payment milestones</h2>
            <span className={`text-sm font-semibold ${milestoneTotal === 100 ? 'text-jade-700' : 'text-amber-700'}`}>
              {milestoneTotal}% of 100%
            </span>
          </div>
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                value={m.title}
                placeholder="Milestone name"
                onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              <div className="flex w-28 items-center">
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={m.percentage}
                  onChange={(e) =>
                    setMilestones(milestones.map((x, j) => (j === i ? { ...x, percentage: Number(e.target.value) } : x)))
                  }
                />
                <span className="ml-1 text-ink-600">%</span>
              </div>
              <button
                type="button"
                className="btn-ghost px-3 text-ink-600"
                onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn-ghost text-sm" onClick={() => setMilestones([...milestones, { title: '', percentage: 0 }])}>
            + Add milestone
          </button>
          <p className="text-xs text-ink-600/70">
            Amounts are derived from the total budget. Completing a milestone auto-generates its invoice.
          </p>
        </section>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link href="/app/projects" className="btn-ghost">
            Cancel
          </Link>
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Create baseline'}
          </button>
        </div>
      </form>
    </div>
  );
}
