'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { money, formatDate } from '@/lib/format';

interface PortalInvoice {
  number: string;
  status: string;
  currency: string;
  total: number;
  dueDate: string | null;
  items: { id: string; description: string; quantity: number; amount: number }[];
  client: { name: string; company: string | null };
  user: { name: string };
}

export default function PayInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    api<{ invoice: PortalInvoice }>(`/portal/invoice/${id}`, { auth: false }).then((d) => {
      setInvoice(d.invoice);
      if (d.invoice.status === 'PAID') setPaid(true);
    });
  }
  useEffect(load, [id]);

  async function pay() {
    setBusy(true);
    await api(`/portal/invoice/${id}/pay`, { method: 'POST', auth: false });
    setPaid(true);
    setBusy(false);
  }

  return (
    <PortalShell>
      {!invoice ? (
        <div className="grid place-items-center py-20 text-jade-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-600">Invoice from {invoice.user.name}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{invoice.number}</h1>
            </div>
            <p className="font-display text-2xl font-semibold text-ink">{money(invoice.total, invoice.currency)}</p>
          </div>

          <div className="card p-6">
            <div className="mb-3 flex justify-between text-sm text-ink-600">
              <span>Billed to {invoice.client.company || invoice.client.name}</span>
              <span>Due {formatDate(invoice.dueDate)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ink-600/10">
                {invoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 text-ink-700">{it.description}</td>
                    <td className="py-2.5 text-right text-ink-600">×{it.quantity}</td>
                    <td className="py-2.5 text-right font-medium text-ink">{money(it.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink-600/10">
                  <td colSpan={2} className="py-2.5 font-semibold text-ink">
                    Total
                  </td>
                  <td className="py-2.5 text-right font-semibold text-ink">{money(invoice.total, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {paid ? (
            <div className="card flex flex-col items-center gap-1 p-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-jade-100 text-jade-700">✓</div>
              <p className="mt-2 font-semibold text-ink">Payment received</p>
              <p className="text-sm text-ink-600">Thank you! This invoice is now marked paid.</p>
            </div>
          ) : (
            <button onClick={pay} disabled={busy} className="btn-primary w-full py-3.5 text-base">
              {busy ? <Spinner className="h-5 w-5" /> : `Pay ${money(invoice.total, invoice.currency)}`}
            </button>
          )}
          <p className="text-center text-xs text-ink-600/50">
            Demo checkout. With a Stripe key configured, this opens a real Stripe payment.
          </p>
        </div>
      )}
    </PortalShell>
  );
}
