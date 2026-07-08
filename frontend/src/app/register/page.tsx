'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Logo, Spinner } from '@/components/ui';
import { AuthAside } from '@/components/AuthAside';

const TYPES = [
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'DESIGNER', label: 'Designer' },
  { value: 'WRITER', label: 'Writer' },
  { value: 'MARKETER', label: 'Marketer' },
  { value: 'OTHER', label: 'Other' },
];

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    freelancerType: 'DEVELOPER',
    niche: '',
    hourlyRate: 65,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace('/app');
  }, [user, router]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        freelancerType: form.freelancerType,
        niche: form.niche || undefined,
        hourlyRate: Number(form.hourlyRate),
      });
      router.replace('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/">
            <Logo />
          </Link>
          <h1 className="mt-8 font-display text-3xl font-semibold text-ink">Create your shield</h1>
          <p className="mt-2 text-ink-700">Free forever. No credit card.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">You are a…</label>
                <select className="input" value={form.freelancerType} onChange={(e) => set('freelancerType', e.target.value)}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Hourly rate ($)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.hourlyRate}
                  onChange={(e) => set('hourlyRate', Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="label">Niche (optional)</label>
              <input
                className="input"
                placeholder="e.g. SaaS landing pages"
                value={form.niche}
                onChange={(e) => set('niche', e.target.value)}
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-700">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-jade-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}
