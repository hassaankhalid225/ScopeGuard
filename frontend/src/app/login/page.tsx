'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Logo, Spinner } from '@/components/ui';
import { AuthAside } from '@/components/AuthAside';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('demo@scopeguard.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace('/app');
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
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
          <h1 className="mt-10 font-display text-3xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-2 text-ink-700">Log in to your scope shield.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-700">
            No account?{' '}
            <Link href="/register" className="font-semibold text-jade-700 hover:underline">
              Start free
            </Link>
          </p>
          <p className="mt-4 rounded-lg bg-sand-100 px-3 py-2 text-xs text-ink-600">
            Demo login is pre-filled: <strong>demo@scopeguard.io</strong> / <strong>password123</strong>
          </p>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}
