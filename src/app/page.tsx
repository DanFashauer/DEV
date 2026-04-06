import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">SignalGrid</p>
        <h1 className="text-4xl font-semibold tracking-tight">Identity-bound physical access for modern workplaces</h1>
        <p className="max-w-2xl text-neutral-600">
          SignalGrid connects badge events, device posture, and policy decisions to deliver adaptive, auditable
          access outcomes.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/demo" className="rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400">
          <h2 className="text-lg font-medium">Interactive demo</h2>
          <p className="mt-2 text-sm text-neutral-600">Run through scenario flows used during pilot validation.</p>
        </Link>

        <Link
          href="/investor-deck"
          className="rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400"
        >
          <h2 className="text-lg font-medium">Investor deck</h2>
          <p className="mt-2 text-sm text-neutral-600">Review the condensed company, product, and roadmap narrative.</p>
        </Link>
      </section>
    </main>
  );
}
