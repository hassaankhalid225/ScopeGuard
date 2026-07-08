'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { Markdown } from '@/components/Markdown';
import { Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

interface PortalContract {
  title: string;
  body: string;
  status: string;
  signedByName: string | null;
  signedAt: string | null;
  user: { name: string };
}

export default function SignContractPage() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<PortalContract | null>(null);
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ contract: PortalContract }>(`/portal/sign/${token}`, { auth: false }).then((d) => {
      setContract(d.contract);
      if (d.contract.status === 'SIGNED') setSigned(true);
    });
  }, [token]);

  async function sign() {
    setError('');
    setBusy(true);
    try {
      await api(`/portal/sign/${token}`, { method: 'POST', auth: false, body: { signedByName: name } });
      setSigned(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell>
      {!contract ? (
        <div className="grid place-items-center py-20 text-jade-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-ink-600">{contract.user.name} sent you a contract to review</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{contract.title}</h1>
          </div>

          <div className="card max-h-[60vh] overflow-y-auto p-6">
            <Markdown source={contract.body} />
          </div>

          {signed || contract.signedByName ? (
            <div className="card flex flex-col items-center gap-1 p-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-jade-100 text-jade-700">✓</div>
              <p className="mt-2 font-semibold text-ink">Signed</p>
              <p className="text-sm text-ink-600">
                Thank you, {contract.signedByName || name}. A copy has been recorded.
              </p>
            </div>
          ) : (
            <div className="card space-y-3 p-5">
              <label className="block">
                <span className="label">Type your full name to sign</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full legal name" />
              </label>
              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
                I have read and agree to the terms of this agreement.
              </label>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button onClick={sign} disabled={!name.trim() || !agree || busy} className="btn-primary w-full py-3">
                {busy ? <Spinner className="h-4 w-4" /> : 'Sign agreement'}
              </button>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  );
}
