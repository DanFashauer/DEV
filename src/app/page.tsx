export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-5 border-b border-neutral-800 pb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">SignalGrid</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Fix Risk Before It Breaks Access</h1>
          <p className="max-w-3xl text-lg text-neutral-300">
            SignalGrid detects risk, makes the access decision, and closes the loop before users get stuck in manual
            remediation.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Why now</h2>
            <p className="mt-3 text-neutral-200">
              Most access and security decisions still happen too late—after trust is assumed, after a session is
              established, or after risk is already present.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">How it works</h2>
            <p className="mt-3 text-neutral-200">
              SignalGrid evaluates identity, device posture, and session context before access proceeds. When risk is
              detected, it can attempt remediation, re-evaluate trust, and return a final decision with auditability.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Closed-loop value</h2>
            <p className="mt-3 text-neutral-200">
              Most systems stop at blocking. SignalGrid closes the loop by detecting risk, attempting remediation,
              re-evaluating trust, and returning a final decision before the workflow breaks.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Who it&apos;s for</h2>
            <p className="mt-3 text-neutral-200">
              Built for identity, endpoint, mobility, and Zero Trust teams that need clearer decisions before access
              proceeds.
            </p>
          </article>
        </section>

        <section className="flex flex-col items-start gap-4 border-t border-neutral-800 pt-10">
          <a
            href="mailto:sales@signalgrid.io?subject=SignalGrid%20Early%20Access%20Request"
            className="rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cyan-200"
          >
            Request Early Access
          </a>
          <p className="text-sm text-neutral-400">For early design-partner conversations and pilot interest.</p>
        </section>
      </div>
    </main>
  );
}
