export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-5 border-b border-neutral-800 pb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">SignalGrid</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Fix Risk Before It Breaks Access
          </h1>
          <p className="max-w-3xl text-lg text-neutral-300">
            SignalGrid is a shared-device access and runtime decision platform for frontline environments that resolves
            identity, device, and session risk before access breaks.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Where SignalGrid fits</h2>
            <p className="mt-3 text-neutral-200">
              Identity systems authenticate. Access systems enforce. SignalGrid decides what happens in between.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Why now</h2>
            <p className="mt-3 text-neutral-200">
              Modern enterprise environments can verify identity, enforce policy, and visualize issues, but they still
              leave a runtime decision gap. When risk is detected, most systems either block the user or rely on manual
              remediation. SignalGrid launches with high-friction frontline shared-device workflows and later expands
              into additional industries where access continuity is mission-critical.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">
              Beyond traditional Zero Trust
            </h2>
            <p className="mt-3 text-neutral-200">
              Traditional Zero Trust architectures verify identity and enforce policy at the point of access.
            </p>
            <p className="mt-4 text-neutral-200">But real-world conditions change.</p>
            <p className="mt-4 text-neutral-200">Devices fail. Networks degrade. Signals become stale.</p>
            <p className="mt-4 text-neutral-200">
              SignalGrid extends Zero Trust into runtime decisioning—ensuring access decisions remain correct even
              after they are made.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Runtime truth</h2>
            <p className="mt-3 text-neutral-200">
              Even when authentication succeeds and compliance looks healthy, runtime conditions can still silently
              fail. We have seen operating environments appear healthy while losing the ability to establish new TCP
              connections after prolonged uptime, forcing manual recovery and disruption. SignalGrid helps ensure
              access decisions reflect runtime truth, not stale or incomplete signals.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">What SignalGrid does</h2>
            <p className="mt-3 text-neutral-200">
              SignalGrid connects identity, device posture, and runtime risk signals, determines whether remediation
              can be attempted, re-evaluates trust after response, and returns a final allow or deny decision with
              audit context.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <h2 className="text-base font-semibold uppercase tracking-wide text-neutral-400">Differentiation</h2>
            <p className="mt-3 text-neutral-200">
              UEM tools show what&apos;s configured. DEX tools show what&apos;s failing. SignalGrid decides what happens
              next and returns a final access decision before workflow disruption.
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
