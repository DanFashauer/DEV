import Link from 'next/link';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SignalGrid</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Request a Demo</h1>
        <p className="max-w-2xl text-lg text-slate-300">
          See how SignalGrid helps enterprise teams decide before risk becomes impact across identity, device posture, client trust evidence,
          and access policy.
        </p>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Demo scheduling</h2>
          <p className="mt-3 text-sm text-slate-300">
            Demo request capture is coming soon. For now, use your standard sales or founder outreach channel to schedule a walkthrough.
          </p>
          <p className="mt-3 text-sm text-slate-400">Placeholder: contact@signalgrid.example • 30-minute product and architecture session.</p>
        </section>

        <Link href="/" className="w-fit rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-cyan-300 hover:text-cyan-200">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
