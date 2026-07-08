'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Spinner, VerdictBadge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import type { Project, ScopeAlert } from '@/lib/types';

export default function ScopePage() {
  return (
    <AppShell>
      <ScopeSentinel />
    </AppShell>
  );
}

function ScopeSentinel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [text, setText] = useState('');
  const [alert, setAlert] = useState<ScopeAlert | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ projects: Project[] }>('/projects').then((d) => {
      setProjects(d.projects);
      if (d.projects[0]) setProjectId(d.projects[0].id);
    });
  }, []);

  const project = projects.find((p) => p.id === projectId);

  async function analyze() {
    if (!projectId) return setError('Create a project first.');
    setError('');
    setBusy(true);
    setAlert(null);
    try {
      const { alert } = await api<{ alert: ScopeAlert }>(`/projects/${projectId}/scope/analyze`, {
        method: 'POST',
        body: { text },
      });
      setAlert(alert);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed');
    } finally {
      setBusy(false);
    }
  }

  async function makeChangeOrder() {
    if (!alert || !project) return;
    await api(`/projects/${project.id}/change-orders`, {
      method: 'POST',
      body: {
        scopeAlertId: alert.id,
        title: 'Change order — extra work',
        description: alert.sourceText,
        extraHours: alert.estimatedHours ?? 0,
        extraCost: alert.estimatedCost ?? 0,
      },
    });
    window.location.href = `/app/projects/${project.id}`;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Scope Sentinel</h1>
        <p className="text-ink-600">
          Paste a client message. AI compares it to your baseline and tells you if it’s out of scope.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="card flex items-center justify-between gap-3 p-5">
          <p className="text-sm text-ink-700">You need a project baseline to run a scope check.</p>
          <Link href="/app/projects/new" className="btn-primary">
            Create a project
          </Link>
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          <label className="block">
            <span className="label">Project</span>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.client.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Client request</span>
            <textarea
              className="input min-h-[140px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the client's email or chat message here…"
            />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end">
            <button onClick={analyze} disabled={busy || text.trim().length < 3} className="btn-primary">
              {busy ? <Spinner className="h-4 w-4" /> : 'Analyze scope'}
            </button>
          </div>
        </div>
      )}

      {alert && (
        <div className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <VerdictBadge verdict={alert.verdict} />
            <span className="text-xs text-ink-600/60">
              {alert.confidence}% confidence · {alert.analysedByAi ? 'Claude AI' : 'heuristic (demo)'}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60">Why</p>
            <p className="mt-1 text-sm text-ink-700">{alert.reasoning}</p>
          </div>

          {alert.estimatedCost ? (
            <div className="flex items-center gap-4 rounded-xl bg-amber-50 px-4 py-3">
              <div>
                <p className="text-xs text-amber-800/70">Estimated extra work</p>
                <p className="font-display text-xl font-semibold text-amber-800">
                  {alert.estimatedHours}h · {money(alert.estimatedCost, project?.currency ?? 'USD')}
                </p>
              </div>
            </div>
          ) : null}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600/60">Suggested reply</p>
              <button
                className="text-xs font-semibold text-jade-700 hover:underline"
                onClick={() => {
                  navigator.clipboard.writeText(alert.suggestedReply);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="mt-1 whitespace-pre-wrap rounded-xl border border-ink-600/10 bg-sand-50 p-3 text-sm text-ink-700">
              {alert.suggestedReply}
            </p>
          </div>

          {alert.verdict !== 'IN_SCOPE' && (
            <div className="flex justify-end gap-2">
              <button onClick={makeChangeOrder} className="btn-primary">
                Draft a change order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
