'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { EmptyState, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Client } from '@/lib/types';

export default function ClientsPage() {
  return (
    <AppShell>
      <Clients />
    </AppShell>
  );
}

function Clients() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [show, setShow] = useState(false);

  function load() {
    api<{ clients: Client[] }>('/clients').then((d) => setClients(d.clients));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Clients</h1>
          <p className="text-ink-600">Track who you work with — and who pays late.</p>
        </div>
        <button onClick={() => setShow(true)} className="btn-primary">
          + Add client
        </button>
      </div>

      {!clients ? (
        <div className="grid place-items-center py-16 text-jade-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client to start creating projects and invoices."
          action={
            <button onClick={() => setShow(true)} className="btn-primary">
              Add a client
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  {c.company && <p className="text-sm text-ink-600">{c.company}</p>}
                </div>
                {c.riskScore > 0 && (
                  <span className="badge bg-red-100 text-red-700">risk {Math.min(100, c.riskScore)}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-600">{c.email}</p>
              <div className="mt-4 flex gap-4 text-xs text-ink-600/70">
                <span>{c._count?.projects ?? 0} projects</span>
                <span>{c._count?.invoices ?? 0} invoices</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <AddClientModal
          onClose={() => setShow(false)}
          onAdded={() => {
            setShow(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/clients', {
        method: 'POST',
        body: { name: form.name, email: form.email, company: form.company || undefined },
      });
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Add client</h2>
        <label className="block">
          <span className="label">Name</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="label">Company (optional)</span>
          <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Add client'}
          </button>
        </div>
      </form>
    </div>
  );
}
