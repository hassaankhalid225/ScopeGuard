'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { EmptyState, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  return (
    <AppShell>
      <Projects />
    </AppShell>
  );
}

function Projects() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api<{ projects: Project[] }>('/projects').then((d) => setProjects(d.projects));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Projects</h1>
          <p className="text-ink-600">Every project is a protected scope baseline.</p>
        </div>
        <Link href="/app/projects/new" className="btn-primary">
          + New project
        </Link>
      </div>

      {!projects ? (
        <div className="grid place-items-center py-16 text-jade-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a baseline with deliverables, revisions and payment milestones — then let AI guard it."
          action={
            <Link href="/app/projects/new" className="btn-primary">
              Create your first project
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const completed = (p.milestones ?? []).filter((m) => m.status === 'COMPLETED').length;
            const total = (p.milestones ?? []).length || 1;
            const pct = Math.round((completed / total) * 100);
            return (
              <Link key={p.id} href={`/app/projects/${p.id}`} className="card p-5 transition hover:shadow-lift">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-sm text-ink-600">{p.client.name}</p>
                <div className="mt-4 h-1.5 rounded-full bg-sand-100">
                  <div className="h-1.5 rounded-full bg-jade-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-ink-600">{pct}% complete</span>
                  <span className="font-semibold text-ink">{money(p.totalBudget, p.currency)}</span>
                </div>
                {(p._count?.scopeAlerts ?? 0) > 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    {p._count?.scopeAlerts} scope alert{p._count?.scopeAlerts === 1 ? '' : 's'}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
