import Link from 'next/link';

const pillars = [
  {
    title: 'Unified Context',
    points: [
      'Identity (Entra / Okta)',
      'Device posture (Intune / Jamf / Workspace ONE)',
      'Client trust evidence (managed state, device identity, session context)',
      'Behavior and risk signals',
    ],
  },
  {
    title: 'Decision Engine',
    points: ['Trust scoring in real time', 'Policy evaluation across identity + device + access', 'Explainable AI-assisted reasoning'],
  },
  {
    title: 'Enforcement Layer',
    points: ['Allow / Deny / Step-up', 'Device and session controls', 'API and workflow enforcement with audit trail'],
  },
];

const integrations = ['Entra ID', 'Okta', 'Intune', 'Jamf', 'Workspace ONE', 'SIEM / XDR', 'ServiceNow'];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SignalGrid</p>
            <p className="text-sm text-slate-400">The Decision Layer for Enterprise Risk</p>
          </div>
          <Link
            href="/investor-deck"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Investor Deck Preview
          </Link>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/30 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SignalGrid</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Decide Before Risk Becomes Impact</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            SignalGrid is the real-time decision engine for identity, device, and access — evaluating device trust and client-trust
            evidence before risky actions execute.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Request Demo</Link>
            <a href="#how-it-works" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
              See How It Works
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-rose-400/20 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Cybersecurity Is Built Backwards</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Detect attackers after they act</li>
              <li>Generate alerts without enough context</li>
              <li>Create tickets for humans to resolve</li>
              <li>Contain damage after impact</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">SignalGrid Decision Model</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>Evaluate trust before execution</li>
              <li>Decide in real-time</li>
              <li>Enforce instantly</li>
              <li>Log intelligently for audit and operations</li>
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">A Real-Time Decision Engine Across Your Stack</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <h3 className="text-base font-semibold text-cyan-200">{pillar.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {pillar.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-8 grid gap-6 scroll-mt-24 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-semibold">How It Works</h2>
            <p className="mt-2 text-sm text-slate-300">Signal Ingest → Context Build → Trust Score → Decision → Enforcement → Audit</p>
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
              User login from unmanaged or low-trust device → Trust score drops → Step-up auth triggered (or access denied) → No unnecessary
              ticket.
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-semibold">Why It Matters</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>Target: up to 70% fewer preventable incidents</li>
              <li>Target: up to 60% fewer tickets on selected workflows</li>
              <li>ms-level decisioning vs minute-level response</li>
              <li>Stronger zero-trust enforcement coverage</li>
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Built for Enterprise Reality</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {integrations.map((integration) => (
              <span key={integration} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                {integration}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-300">We don’t replace — we orchestrate.</p>
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
            SignalGrid prevents incidents upstream, reduces ITSM load, and feeds meaningful events into enterprise ITIL workflows with
            identity-, device-, and session-context enforcement decisions.
          </div>
        </section>

        <section className="mt-8 mb-6 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-8 text-center">
          <p className="text-2xl font-semibold">Stop reacting. Start deciding.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo" className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Request Demo</Link>
            <a href="#how-it-works" className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
              See How It Works
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
