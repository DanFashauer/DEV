import Link from 'next/link';

const slides = [
  {
    heading: 'Problem',
    text: 'Organizations need to bind physical access events to verified user and device context in real time.',
  },
  {
    heading: 'Solution',
    text: 'SignalGrid unifies badge signals, endpoint posture, and adaptive policy controls with a full audit trail.',
  },
  {
    heading: 'Go-to-market',
    text: 'Founder-led pilot deployments prioritize regulated and operationally sensitive environments first.',
  },
];

export default function InvestorDeckPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Investor deck</p>
        <h1 className="text-4xl font-semibold tracking-tight">SignalGrid at a glance</h1>
      </header>

      <section className="grid gap-4">
        {slides.map((slide) => (
          <article key={slide.heading} className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-lg font-medium">{slide.heading}</h2>
            <p className="mt-2 text-sm text-neutral-600">{slide.text}</p>
          </article>
        ))}
      </section>

      <p className="text-sm text-neutral-600">
        Want to run the product narrative as a live flow?{' '}
        <Link className="underline" href="/demo">
          Open the demo scenarios
        </Link>
        .
      </p>
    </main>
  );
}
