'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Markdown } from '@/components/Markdown';
import { Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Contract } from '@/lib/types';

export default function ContractDetailPage() {
  return (
    <AppShell>
      <ContractDetail />
    </AppShell>
  );
}

function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [signUrl, setSignUrl] = useState('');
  const [toast, setToast] = useState('');

  function load() {
    api<{ contract: Contract }>(`/contracts/${id}`).then((d) => setContract(d.contract));
  }
  useEffect(load, [id]);

  async function send() {
    const res = await api<{ signUrl: string }>(`/contracts/${id}/send`, { method: 'POST' });
    setSignUrl(res.signUrl);
    setToast('Contract sent for signature.');
    load();
  }

  if (!contract) {
    return (
      <div className="grid place-items-center py-20 text-jade-600">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/contracts" className="text-sm text-ink-600 hover:text-jade-700">
            ← Contracts
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{contract.title}</h1>
          <p className="text-sm capitalize text-ink-600">
            {contract.template.replace('-', ' ')} · {contract.jurisdiction} ·{' '}
            {contract.generatedByAi ? '✨ AI-generated' : 'template'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`badge ${
              contract.status === 'SIGNED' ? 'bg-jade-100 text-jade-800' : 'bg-sand-100 text-ink-700'
            }`}
          >
            {contract.status.toLowerCase()}
          </span>
          {contract.status !== 'SIGNED' && (
            <button onClick={send} className="btn-primary">
              Send for signature
            </button>
          )}
          <Link href={`/portal/sign/${contract.signToken}`} target="_blank" className="btn-outline">
            Preview ↗
          </Link>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl bg-jade-50 px-4 py-2.5 text-sm font-medium text-jade-800">
          {toast}{' '}
          {signUrl && (
            <Link href={signUrl} target="_blank" className="underline">
              Open signing link
            </Link>
          )}
        </div>
      )}

      {contract.signedByName && (
        <div className="rounded-xl bg-jade-50 px-4 py-3 text-sm text-jade-800">
          Signed by <strong>{contract.signedByName}</strong>.
        </div>
      )}

      <div className="card p-7">
        <Markdown source={contract.body} />
      </div>
    </div>
  );
}
