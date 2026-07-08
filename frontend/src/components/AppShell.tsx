'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { clsx } from '@/lib/clsx';
import { Logo, Spinner } from './ui';

const NAV = [
  { href: '/app', label: 'Dashboard', icon: GridIcon },
  { href: '/app/projects', label: 'Projects', icon: FolderIcon },
  { href: '/app/scope', label: 'Scope Sentinel', icon: RadarIcon },
  { href: '/app/invoices', label: 'Invoices', icon: ReceiptIcon },
  { href: '/app/contracts', label: 'Contracts', icon: DocIcon },
  { href: '/app/clients', label: 'Clients', icon: UsersIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-sand-50 text-jade-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-600/10 bg-white px-4 py-6 lg:flex">
          <Link href="/app" className="px-2">
            <Logo />
          </Link>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'bg-jade-50 text-jade-800' : 'text-ink-700 hover:bg-sand-100',
                  )}
                >
                  <Icon className={clsx('h-5 w-5', active ? 'text-jade-600' : 'text-ink-600/60')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-ink-600/10 bg-sand-50 p-3">
            <p className="text-xs font-medium text-ink-600/70">Plan</p>
            <p className="text-sm font-semibold text-ink">{planLabel(user.plan)}</p>
            {user.plan === 'STARTER' && (
              <Link href="/app/settings" className="mt-1 inline-block text-xs font-semibold text-jade-700 hover:underline">
                Upgrade to Pro →
              </Link>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-600/10 bg-sand-50/80 px-5 py-3 backdrop-blur">
            <div className="lg:hidden">
              <Logo />
            </div>
            <MobileNav pathname={pathname} />
            <div className="flex items-center gap-3">
              <Link href="/app/settings" className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-ink">{user.name}</p>
                <p className="text-xs text-ink-600/70">{user.email}</p>
              </Link>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
                {user.name.charAt(0)}
              </div>
              <button onClick={logout} className="btn-ghost px-3 py-2 text-sm" title="Log out">
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto lg:hidden">
      {NAV.map((item) => {
        const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium',
              active ? 'bg-jade-50 text-jade-800' : 'text-ink-600',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function planLabel(plan: string) {
  return { STARTER: 'Starter (Free)', PRO: 'Pro', AGENCY: 'Agency' }[plan] ?? plan;
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
type IconProps = { className?: string };
function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function FolderIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function RadarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12l6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ReceiptIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function DocIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 11a3 3 0 0 0 0-6M20.5 19a5.5 5.5 0 0 0-4-5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M15 12H6m0 0l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
