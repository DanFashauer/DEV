import Image from 'next/image';

const outcomes = [
  {
    title: 'Allow',
    color: 'text-[#5E8F73]',
    body: 'Trusted identity, healthy posture, and expected session context continue with minimal friction.',
  },
  {
    title: 'Step-Up',
    color: 'text-[#B08B57]',
    body: 'Elevated risk triggers additional verification and operator-visible context before access proceeds.',
  },
  {
    title: 'Deny',
    color: 'text-[#A15B5B]',
    body: 'Unknown or high-risk runtime states fail closed and return auditable reasoning for follow-up.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#15181B] px-6 py-12 text-[#F3F1EC] md:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <header className="rounded-3xl border border-[#2A3136] bg-[#1D2226] p-8 md:p-12">
          <div className="mb-8 flex items-center gap-4">
            <Image src="/signalgrid-logo-mark.svg" alt="SignalGrid mark" width={44} height={44} className="h-11 w-11" priority />
            <Image src="/signalgrid-logo.svg" alt="SignalGrid" width={180} height={28} className="h-7 w-auto" priority />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D8D4CC]">
                Runtime decision layer for Zero Trust orchestration
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Access decisions should stay correct after authentication.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#D8D4CC] md:text-lg">
                SignalGrid helps shared-device and frontline teams evaluate identity, device posture, and session
                context in real time so access outcomes reflect runtime truth, not stale checks.
              </p>
              <a
                href="mailto:sales@signalgrid.io?subject=SignalGrid%20Early%20Access%20Request"
                className="inline-flex rounded-lg border border-[#4F8C87] bg-[#4F8C87]/10 px-5 py-3 text-sm font-semibold text-[#F3F1EC] transition hover:border-[#6FA7A1] hover:bg-[#6FA7A1]/15"
              >
                Request early access
              </a>
            </div>
            <Image
              src="/readme-hero.svg"
              alt="SignalGrid decision flow illustration"
              width={1240}
              height={440}
              className="w-full rounded-2xl border border-[#2A3136] bg-[#15181B] p-3"
              priority
            />
          </div>
        </header>

        <section className="grid gap-6 rounded-3xl border border-[#2A3136] bg-[#1D2226]/70 p-8 md:grid-cols-3">
          <h2 className="text-2xl font-semibold md:col-span-3">The runtime access gap</h2>
          <p className="text-[#D8D4CC]">
            Identity systems authenticate. Enforcement systems act. Critical frontline sessions still break when runtime
            conditions change between those points.
          </p>
          <p className="text-[#D8D4CC]">
            SignalGrid orchestrates trust signals across identity, device posture, and session context before
            disruptions cascade into downtime.
          </p>
          <p className="text-[#D8D4CC]">
            The current release candidate is an MVP/demo path built to validate deterministic runtime outcomes and
            auditable decision context.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold">How SignalGrid works</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              'Ingest identity and posture signals',
              'Evaluate runtime session context',
              'Apply policy logic and orchestration paths',
              'Return an auditable allow, step-up, or deny outcome',
            ].map((step, idx) => (
              <article key={step} className="rounded-2xl border border-[#2A3136] bg-[#1D2226] p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4F8C87]">Step {idx + 1}</p>
                <p className="text-sm leading-6 text-[#D8D4CC]">{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold">Demo outcomes: Allow / Deny / Step-Up</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <article key={outcome.title} className="rounded-2xl border border-[#2A3136] bg-[#1D2226] p-6">
                <h3 className={`text-xl font-semibold ${outcome.color}`}>{outcome.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#D8D4CC]">{outcome.body}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-[#D8D4CC]">
            Outcomes shown in the current environment are deterministic MVP/demo behaviors and should be validated in
            pilot deployments before production claims.
          </p>
        </section>

        <section className="rounded-3xl border border-[#2A3136] bg-[#1D2226]/70 p-8">
          <h2 className="text-2xl font-semibold">Who it is for</h2>
          <ul className="mt-5 grid gap-4 text-[#D8D4CC] md:grid-cols-2">
            <li className="rounded-xl border border-[#2A3136] bg-[#15181B]/50 p-4">
              Security and identity teams supporting shared or mobile frontline devices.
            </li>
            <li className="rounded-xl border border-[#2A3136] bg-[#15181B]/50 p-4">
              Operations teams that need runtime access continuity with clear, auditable decisions.
            </li>
            <li className="rounded-xl border border-[#2A3136] bg-[#15181B]/50 p-4">
              Organizations aligning Zero Trust programs with session-level orchestration, not static checks only.
            </li>
            <li className="rounded-xl border border-[#2A3136] bg-[#15181B]/50 p-4">
              Design partners exploring early-stage posture-aware access controls in constrained environments.
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-[#4F8C87]/60 bg-[#4F8C87]/10 p-8 text-center">
          <h2 className="text-2xl font-semibold">Early access</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[#D8D4CC]">
            SignalGrid is currently in controlled demo and design-partner validation. Request early access to review
            roadmap, constraints, and pilot-fit criteria.
          </p>
          <a
            href="mailto:sales@signalgrid.io?subject=SignalGrid%20Early%20Access%20Request"
            className="mt-6 inline-flex rounded-lg border border-[#4F8C87] bg-[#15181B] px-6 py-3 text-sm font-semibold text-[#F3F1EC] hover:border-[#6FA7A1]"
          >
            Request early access
          </a>
        </section>
      </div>
    </main>
  );
}
