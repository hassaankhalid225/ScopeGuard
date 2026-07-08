import Link from 'next/link';
import { PortalShell } from '@/components/PortalShell';

export default function PaySuccessPage() {
  return (
    <PortalShell>
      <div className="card mt-10 flex flex-col items-center gap-2 p-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-jade-100 text-2xl text-jade-700">✓</div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Payment successful</h1>
        <p className="text-ink-600">Thank you — your invoice has been paid in full.</p>
        <Link href="/" className="btn-outline mt-4">
          Learn about ScopeGuard
        </Link>
      </div>
    </PortalShell>
  );
}
