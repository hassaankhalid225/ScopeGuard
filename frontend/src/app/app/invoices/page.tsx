'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { EmptyState, Spinner, StatusBadge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { money, formatDate, relativeDays } from '@/lib/format';
import type { Client, Invoice, Project } from '@/lib/types';

export default function InvoicesPage() {
  return (
    <AppShell>
      <Invoices />
    </AppShell>
  );
}

function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState('');

  function load() {
    api<{ invoices: Invoice[] }>('/invoices').then((d) => setInvoices(d.invoices));
  }
  useEffect(load, []);

  async function markPaid(id: string) {
    await api(`/invoices/${id}/mark-paid`, { method: 'POST' });
    setToast('Marked as paid.');
    load();
  }
  async function send(id: string) {
    await api(`/invoices/${id}/send`, { method: 'POST' });
    setToast('Invoice sent.');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Invoices</h1>
          <p className="text-ink-600">Automatic on milestones — or create one in seconds.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + New invoice
        </button>
      </div>

      {toast && <div className="rounded-xl bg-jade-50 px-4 py-2.5 text-sm font-medium text-jade-800">{toast}</div>}

      {!invoices ? (
        <div className="grid place-items-center py-16 text-jade-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Complete a project milestone to auto-generate one, or create a manual invoice."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create an invoice
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-600/10 text-left text-xs uppercase tracking-wide text-ink-600/60">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600/10">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-sand-50">
                  <td className="px-5 py-3 font-medium text-ink">{inv.number}</td>
                  <td className="px-5 py-3 text-ink-700">{inv.client?.name}</td>
                  <td className="px-5 py-3 text-ink-600">
                    {formatDate(inv.dueDate)}{' '}
                    {(inv.status === 'OVERDUE' || inv.status === 'SENT') && (
                      <span className="text-xs text-ink-600/60">{relativeDays(inv.dueDate)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">{money(inv.total, inv.currency)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {inv.status === 'DRAFT' && (
                        <button onClick={() => send(inv.id)} className="btn-ghost px-2.5 py-1.5 text-xs">
                          Send
                        </button>
                      )}
                      {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                        <button onClick={() => markPaid(inv.id)} className="btn-outline px-2.5 py-1.5 text-xs">
                          Mark paid
                        </button>
                      )}
                      {inv.paymentUrl && (
                        <a href={inv.paymentUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs">
                          Link ↗
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setToast('Invoice created.');
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitAmount: 0 }]);
  const [autoSend, setAutoSend] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ clients: Client[] }>('/clients').then((d) => {
      setClients(d.clients);
      if (d.clients[0]) setClientId(d.clients[0].id);
    });
    api<{ projects: Project[] }>('/projects').then((d) => setProjects(d.projects));
  }, []);

  const total = items.reduce((s, i) => s + Number(i.unitAmount) * Number(i.quantity), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/invoices', {
        method: 'POST',
        body: {
          clientId,
          projectId: projectId || undefined,
          autoSend,
          items: items
            .filter((i) => i.description.trim())
            .map((i) => ({ description: i.description, quantity: Number(i.quantity), unitAmount: Number(i.unitAmount) })),
        },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="card w-full max-w-lg space-y-4 p-6"
      >
        <h2 className="font-display text-xl font-semibold text-ink">New invoice</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Client</span>
            <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Project (optional)</span>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">—</option>
              {projects
                .filter((p) => p.client.id === clientId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <span className="label">Line items</span>
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Description"
                value={it.description}
                onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
              />
              <input
                className="input w-16"
                type="number"
                min={1}
                value={it.quantity}
                onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))}
              />
              <input
                className="input w-24"
                type="number"
                min={0}
                placeholder="Amount"
                value={it.unitAmount}
                onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, unitAmount: Number(e.target.value) } : x)))}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => setItems([...items, { description: '', quantity: 1, unitAmount: 0 }])}
          >
            + Add line
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
          Send immediately (with payment link)
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex items-center justify-between border-t border-ink-600/10 pt-4">
          <p className="font-semibold text-ink">Total: {money(total)}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
