'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/types';

const PLANS = [
  { value: 'STARTER', label: 'Starter (Free)', desc: '2 projects · 5 invoices/mo' },
  { value: 'PRO', label: 'Pro — $9/mo', desc: 'Unlimited · AI scope · auto-invoicing' },
  { value: 'AGENCY', label: 'Agency — $29/mo', desc: 'Team · white-label · analytics' },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <Settings />
    </AppShell>
  );
}

function Settings() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    niche: user?.niche ?? '',
    hourlyRate: user?.hourlyRate ?? 50,
    currency: user?.currency ?? 'USD',
  });
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { user: updated } = await api<{ user: User }>('/auth/me', {
        method: 'PATCH',
        body: { name: form.name, niche: form.niche, hourlyRate: Number(form.hourlyRate), currency: form.currency },
      });
      setUser(updated);
      setToast('Saved.');
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function changePlan(plan: string) {
    const { user: updated } = await api<{ user: User }>('/auth/me', { method: 'PATCH', body: { plan } });
    setUser(updated);
    setToast(`Switched to ${plan}.`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      {toast && <div className="rounded-xl bg-jade-50 px-4 py-2.5 text-sm font-medium text-jade-800">{toast}</div>}

      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="font-semibold text-ink">Profile</h2>
        <label className="block">
          <span className="label">Name</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Niche</span>
          <input className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Hourly rate (used for scope pricing)</span>
            <input
              className="input"
              type="number"
              min={1}
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="label">Default currency</span>
            <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {['USD', 'EUR', 'GBP', 'PKR'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : 'Save'}
          </button>
        </div>
      </form>

      <div className="card space-y-3 p-5">
        <h2 className="font-semibold text-ink">Plan</h2>
        <div className="space-y-2">
          {PLANS.map((p) => (
            <button
              key={p.value}
              onClick={() => changePlan(p.value)}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                user.plan === p.value ? 'border-jade-400 bg-jade-50' : 'border-ink-600/10 hover:border-jade-300'
              }`}
            >
              <div>
                <p className="font-medium text-ink">{p.label}</p>
                <p className="text-xs text-ink-600">{p.desc}</p>
              </div>
              {user.plan === p.value && <span className="badge bg-jade-100 text-jade-800">current</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-600/60">
          Demo: switching plans is instant. Production would route through Stripe Billing.
        </p>
      </div>
    </div>
  );
}
