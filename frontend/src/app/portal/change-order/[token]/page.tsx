'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';

interface PortalChangeOrder {
  title: string;
  description: string;
  extraHours: number;
  extraCost: number;
  status: string;
  project: { name: string; currency: string };
}

export default function ChangeOrderPage() {
  const { token } = useParams<{ token: string }>();
  const [co, setCo] = useState<PortalChangeOrder | null>(null);
  const [done, setDone] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ changeOrder: PortalChangeOrder }>(`/portal/change-order/${token}`, { auth: false }).then((d) => {
      setCo(d.changeOrder);
      if (d.changeOrder.status === 'ACCEPTED' || d.changeOrder.status === 'REJECTED') {
        setDone(d.changeOrder.status);
      }
    });
  }, [token]);

  async function respond(accept: boolean) {
    setBusy(true);
    await api(`/portal/change-order/${token}/respond`, { method: 'POST', auth: false, body: { accept } });
    setDone(accept ? 'ACCEPTED' : 'REJECTED');
    setBusy(false);
  }

  return (
    <PortalShell>
      {!co ? (
        <div className="grid place-items-center py-20 text-jade-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-ink-600">Change order for {co.project.name}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{co.title}</h1>
          </div>

          <div className="card space-y-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60">Requested work</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{co.description}</p>
            </div>
            <div className="flex items-center gap-6 rounded-xl bg-sand-100 p-4">
              <div>
                <p className="text-xs text-ink-600">Additional time</p>
                <p className="font-display text-xl font-semibold text-ink">{co.extraHours}h</p>
              </div>
              <div>
                <p className="text-xs text-ink-600">Additional cost</p>
                <p className="font-display text-xl font-semibold text-jade-700">
                  {money(co.extraCost, co.project.currency)}
                </p>
              </div>
            </div>
          </div>

          {done ? (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                done === 'ACCEPTED' ? 'bg-jade-50 text-jade-800' : 'bg-red-50 text-red-700'
              }`}
            >
              You have {done === 'ACCEPTED' ? 'accepted' : 'declined'} this change order.
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => respond(true)} disabled={busy} className="btn-primary flex-1 py-3">
                {busy ? <Spinner className="h-4 w-4" /> : 'Accept & approve'}
              </button>
              <button onClick={() => respond(false)} disabled={busy} className="btn-outline flex-1 py-3">
                Decline
              </button>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  );
}
