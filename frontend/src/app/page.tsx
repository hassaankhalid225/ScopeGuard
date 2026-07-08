import Link from 'next/link';
import { Logo, ShieldIcon } from '@/components/ui';

const STATS = [
  { value: '1.57B', label: 'Freelancers worldwide' },
  { value: '$15.6K', label: 'Lost per freelancer / year' },
  { value: '52%', label: 'Projects hit by scope creep' },
];

const PILLARS = [
  {
    title: 'AI Scope Sentinel',
    desc: 'Paste any client request and AI tells you instantly if it’s out of scope — with a polite reply and a price for the extra work.',
    points: ['Real-time scope-drift detection', 'Revision-limit tracking', 'Auto-drafted change orders'],
  },
  {
    title: 'AI Invoice Engine',
    desc: 'Never write an invoice again. Milestones, dates and triggers fire professional invoices automatically — with escalating reminders.',
    points: ['Auto-invoice on milestone', 'Day 1 / 7 / 14 / 30 reminders', 'Late-fee & payment links'],
  },
  {
    title: 'AI Contract Generator',
    desc: 'Turn a plain-language brief into a legally-sound contract in 5 minutes. Client e-signs in the portal. Project protected.',
    points: ['Brief → full contract', 'IP transfers only after payment', 'Built-in kill-switch clause'],
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    cadence: 'forever — no card',
    features: ['2 active projects', '5 invoices / month', 'Basic contract templates', 'Manual scope tracking'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    cadence: 'per month, billed annually',
    features: ['Unlimited projects', 'AI scope detection', 'Auto-invoicing', 'AI contract generation', 'Email support'],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$29',
    cadence: 'per month, billed annually',
    features: ['Everything in Pro', '5 team members', 'White-label portal', 'Advanced analytics', 'Priority support'],
    cta: 'Start Agency',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-12 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="badge bg-jade-100 text-jade-800">AI Shield for Freelancers</span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-ink md:text-6xl">
            Stop scope creep.
            <br />
            Get paid <span className="text-jade-600">on time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-700">
            ScopeGuard gives every freelancer an AI lawyer, an AI accountant and an AI project manager —
            detecting out-of-scope work, auto-invoicing your milestones, and turning briefs into smart contracts.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Protect your work — free
            </Link>
            <Link href="/login" className="btn-outline px-6 py-3 text-base">
              See the demo
            </Link>
          </div>
          <p className="mt-3 text-xs text-ink-600/70">No credit card · Free forever plan · 5-minute setup</p>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="card px-4 py-5 text-center">
              <p className="font-display text-2xl font-semibold text-jade-700 md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-ink-600 md:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem strip */}
      <section className="border-y border-ink-600/10 bg-ink py-14 text-white">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center font-display text-2xl font-semibold md:text-3xl">
            Freelancing’s three silent revenue killers
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { t: 'Scope creep', d: 'A 20-hour project quietly becomes 40 — unpaid. 52% of projects are affected.' },
              { t: 'Late payments', d: '85% of freelancers face late payments. Average delay: 45–90 days.' },
              { t: 'Vague agreements', d: '1 in 3 projects ends in a payment or scope dispute. Clients have lawyers; you have nothing.' },
            ].map((p) => (
              <div key={p.t} className="rounded-2xl border border-white/10 bg-ink-700/50 p-5">
                <p className="font-semibold text-jade-300">{p.t}</p>
                <p className="mt-2 text-sm text-white/70">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-semibold text-ink">Three AI pillars, one shield</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-700">
          Everything you need to protect your scope, your cash flow and your agreements — affordable and automatic.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="card flex flex-col p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-jade-600 text-white">
                <ShieldIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-700">{p.desc}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-ink-700">
                    <CheckDot /> {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-ink-600/10 bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-semibold text-ink">Affordable, AI-native pricing</h2>
          <p className="mt-3 text-center text-ink-700">
            HoneyBook starts at $19–$129/mo with no scope protection. ScopeGuard does more, for less.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`card flex flex-col p-6 ${tier.highlight ? 'ring-2 ring-jade-500' : ''}`}
              >
                {tier.highlight && (
                  <span className="badge mb-3 w-fit bg-jade-100 text-jade-800">Most popular</span>
                )}
                <p className="font-semibold text-ink">{tier.name}</p>
                <p className="mt-2 font-display text-4xl font-semibold text-ink">{tier.price}</p>
                <p className="text-xs text-ink-600/70">{tier.cadence}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-ink-700">
                      <CheckDot /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 ${tier.highlight ? 'btn-primary' : 'btn-outline'} w-full`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold text-ink">Protect your next project in 5 minutes</h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-700">
          Join freelancers who’ve stopped giving away free work. Set up your first scope baseline today.
        </p>
        <Link href="/register" className="btn-primary mt-6 px-7 py-3 text-base">
          Get started — it’s free
        </Link>
      </section>

      <footer className="border-t border-ink-600/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-ink-600 sm:flex-row">
          <Logo mark className="text-base" />
          <p>Protect your work. Get paid. Grow free.</p>
          <p>© {new Date().getFullYear()} ScopeGuard</p>
        </div>
      </footer>
    </div>
  );
}

function CheckDot() {
  return (
    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-jade-100 text-jade-700">
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
        <path d="M2.5 6.2l2.2 2.2 4-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
