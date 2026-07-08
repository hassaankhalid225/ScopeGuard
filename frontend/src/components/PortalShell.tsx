import { Logo } from './ui';

/** Lightweight chrome for the public, unauthenticated client portal pages. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-ink-600/10 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Logo />
          <span className="text-xs text-ink-600/60">Secure client portal</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-3xl px-5 pb-10 pt-4 text-center text-xs text-ink-600/50">
        Powered by ScopeGuard · Protect your work. Get paid.
      </footer>
    </div>
  );
}
