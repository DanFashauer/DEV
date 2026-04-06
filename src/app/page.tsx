export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-5 border-b border-neutral-800 pb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">SignalGrid</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Fix Risk Before It Breaks Access</h1>
          <p className="max-w-3xl text-lg text-neutral-300">
            Intune identifies non-compliance. Conditional Access blocks the user. SignalGrid diagnoses, remediates,
            and re-evaluates in real time so access can recover before operations stall.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Where SignalGrid fits</h2>
            <p className="mt-3 text-neutral-200">
              You keep Intune and Entra. SignalGrid augments them with a closed-loop decision and recovery layer
              between detection and enforcement.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Closed-loop decisioning</h2>
            <p className="mt-3 text-neutral-200">
              Input signals include device non-compliance, user risk, and session context. SignalGrid classifies root
              cause, maps remediation steps, executes response, and re-checks trust before returning allow or deny.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Business outcome</h2>
            <p className="mt-3 text-neutral-200">
              Replace ticket-driven recovery that takes hours with automated recovery loops that restore compliant
              access in minutes.
            </p>
          </article>
        </section>

        <section className="space-y-4 border-t border-neutral-800 pt-10">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-400">Next step</p>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">See your access blockers mapped in 20 minutes</h2>
          <p className="max-w-3xl text-neutral-300">
            Bring one broken access flow. We&apos;ll map detection gaps, remediation paths, and a pilot-ready closed-loop
            architecture.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cyan-200"
            >
              Book Workflow Teardown
            </button>
            <button
              type="button"
              className="rounded-lg border border-neutral-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-200"
            >
              Request Pilot Plan
            </button>
          </div>
          <p className="text-sm text-neutral-500">Response SLA: within 1 business day • Identity • Device • Session • Remediation</p>
        </section>
      </div>
    </main>
  );
}
