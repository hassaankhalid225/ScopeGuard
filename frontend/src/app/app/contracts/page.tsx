'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { EmptyState, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Client, Contract, Project } from '@/lib/types';

export default function ContractsPage() {
  return (
    <AppShell>
      <Contracts />
    </AppShell>
  );
}

function Contracts() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [showGen, setShowGen] = useState(false);

  function load() {
    api<{ contracts: Contract[] }>('/contracts').then((d) => setContracts(d.contracts));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Contracts</h1>
          <p className="text-ink-600">Turn a brief into a signed agreement in minutes.</p>
        </div>
        <button onClick={() => setShowGen(true)} className="btn-primary">
          + Generate contract
        </button>
      </div>

      {!contracts ? (
        <div className="grid place-items-center py-16 text-jade-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="Paste a project brief and let AI draft a contract with scope, payment, IP and kill-switch clauses."
          action={
            <button onClick={() => setShowGen(true)} className="btn-primary">
              Generate your first contract
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((c) => (
            <Link key={c.id} href={`/app/contracts/${c.id}`} className="card p-5 transition hover:shadow-lift">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <span
                  className={`badge ${
                    c.status === 'SIGNED'
                      ? 'bg-jade-100 text-jade-800'
                      : c.status === 'SENT'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-sand-100 text-ink-700'
                  }`}
                >
                  {c.status.toLowerCase()}
                </span>
              </div>
              <p className="mt-1 text-sm capitalize text-ink-600">
                {c.template.replace('-', ' ')} · {c.jurisdiction}
              </p>
              <p className="mt-3 text-xs text-ink-600/60">
                {c.generatedByAi ? '✨ AI-generated' : 'Template'} · {formatDate(c.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showGen && (
        <GenerateModal
          onClose={() => setShowGen(false)}
          onDone={() => {
            setShowGen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function GenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    title: '',
    brief: '',
    template: 'web-dev',
    jurisdiction: 'US',
    clientId: '',
    projectId: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ clients: Client[] }>('/clients').then((d) => setClients(d.clients));
    api<{ projects: Project[] }>('/projects').then((d) => setProjects(d.projects));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/contracts/generate', {
        method: 'POST',
        body: {
          title: form.title,
          brief: form.brief,
          template: form.template,
          jurisdiction: form.jurisdiction,
          clientId: form.clientId || undefined,
          projectId: form.projectId || undefined,
        },
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card w-full max-w-lg space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Generate a contract</h2>
        <label className="block">
          <span className="label">Title</span>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Acme Studio — Web Development Agreement"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Template</span>
            <select className="input" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}>
              <option value="web-dev">Web Development</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
              <option value="marketing">Marketing</option>
              <option value="general">General</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Jurisdiction</span>
            <select className="input" value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}>
              {['US', 'UK', 'EU', 'PK'].map((j) => (
                <option key={j}>{j}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Client (optional)</span>
            <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Project (optional)</span>
            <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="label">Project brief</span>
          <textarea
            className="input min-h-[120px]"
            value={form.brief}
            onChange={(e) => setForm({ ...form, brief: e.target.value })}
            placeholder="Describe the work, deliverables, timeline and payment terms in plain language…"
            required
          />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}
