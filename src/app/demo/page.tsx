import Link from 'next/link';

const demoScenarios = [
  {
    title: 'Healthcare: shared iPad',
    detail: 'Nurse authenticates at a station while posture telemetry drives policy decisions.',
  },
  {
    title: 'Logistics: handheld scanner',
    detail: 'Operator badge event is paired with device state before granting access.',
  },
  {
    title: 'Retail: kiosk terminal',
    detail: 'Store associate flow demonstrates frictionless recovery and auditability.',
  },
];

export default function DemoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Demo</p>
        <h1 className="text-4xl font-semibold tracking-tight">Pilot-ready scenario walkthroughs</h1>
        <p className="max-w-2xl text-neutral-600">
          Use these flows to validate the end-to-end experience from badge event to policy action and audit evidence.
        </p>
      </header>

      <ul className="grid gap-4">
        {demoScenarios.map((scenario) => (
          <li key={scenario.title} className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-lg font-medium">{scenario.title}</h2>
            <p className="mt-2 text-sm text-neutral-600">{scenario.detail}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-neutral-600">
        Need the broader product context?{' '}
        <Link className="underline" href="/investor-deck">
          View the investor deck summary
        </Link>
        .
      </p>
    </main>
  );
}
