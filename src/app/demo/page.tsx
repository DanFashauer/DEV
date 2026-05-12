'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { demoScenarios, type DemoScenario, type DemoSessionResult } from '@/lib/demo/scenarios';

const stateStyles: Record<DemoScenario['signals'][number]['state'], string> = {
  good: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  warn: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  bad: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
  unknown: 'border-neutral-500/50 bg-neutral-700/40 text-neutral-200',
};

const timelineStyles: Record<DemoScenario['timeline'][number]['status'], string> = {
  complete: 'border-emerald-400 bg-emerald-400/20 text-emerald-100',
  blocked: 'border-rose-400 bg-rose-400/20 text-rose-100',
  review: 'border-amber-400 bg-amber-400/20 text-amber-100',
};

type DemoRunState =
  | { status: 'idle'; result: null; error: null }
  | { status: 'running'; result: null; error: null }
  | { status: 'complete'; result: DemoSessionResult; error: null }
  | { status: 'error'; result: null; error: string };

export default function DemoPage() {
  const [selectedId, setSelectedId] = useState(demoScenarios[0].id);
  const [runState, setRunState] = useState<DemoRunState>({ status: 'idle', result: null, error: null });
  const selectedScenario = useMemo(
    () => demoScenarios.find((scenario) => scenario.id === selectedId) ?? demoScenarios[0],
    [selectedId],
  );
  const auditPreview = runState.status === 'complete' ? runState.result.demo.audit : selectedScenario.audit;

  async function runScenario(scenarioId = selectedScenario.id) {
    setSelectedId(scenarioId);
    setRunState({ status: 'running', result: null, error: null });

    try {
      const response = await fetch('/api/demo/session-start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          'message' in payload &&
          typeof payload.message === 'string'
            ? payload.message
            : 'Demo session failed to start.';
        setRunState({ status: 'error', result: null, error: message });
        return;
      }

      setRunState({ status: 'complete', result: payload as DemoSessionResult, error: null });
    } catch {
      setRunState({
        status: 'error',
        result: null,
        error: 'Demo session API is unavailable. Check that the app server is running and try again.',
      });
    }
  }

  function selectScenario(scenarioId: DemoScenario['id']) {
    setSelectedId(scenarioId);
    setRunState({ status: 'idle', result: null, error: null });
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-5 border-b border-neutral-800 pb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">SignalGrid interactive demo</p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                See runtime access decisions in under 3 minutes
              </h1>
              <p className="max-w-3xl text-lg text-neutral-300">
                Choose a deterministic scenario, run a safe demo session, and watch SignalGrid combine identity, device
                posture, location, and runtime risk into a final shared-device access outcome.
              </p>
            </div>
            <Link
              className="w-fit rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-cyan-200"
              href="/"
            >
              Back to home
            </Link>
          </div>
        </header>

        <section className="grid gap-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Safe demo contract</p>
            <p className="mt-2 text-sm text-cyan-50">Deterministic inputs only</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">External effects</p>
            <p className="mt-2 text-sm text-cyan-50">No real webhooks called</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Data safety</p>
            <p className="mt-2 text-sm text-cyan-50">No production data mutated</p>
          </div>
        </section>

        <section aria-label="Demo scenarios" className="grid gap-3 md:grid-cols-3">
          {demoScenarios.map((scenario) => {
            const isSelected = scenario.id === selectedScenario.id;
            const isRunning = runState.status === 'running' && selectedScenario.id === scenario.id;
            return (
              <article
                key={scenario.id}
                className={`rounded-2xl border p-5 transition ${
                  isSelected
                    ? 'border-cyan-300 bg-cyan-400/10 shadow-lg shadow-cyan-950/30'
                    : 'border-neutral-800 bg-neutral-900/70 hover:border-neutral-600'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Scenario</p>
                <h2 className="mt-3 text-lg font-semibold text-neutral-100">{scenario.cardTitle}</h2>
                <p className="mt-2 text-sm text-neutral-400">{scenario.outcome}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-neutral-500"
                    onClick={() => selectScenario(scenario.id)}
                    type="button"
                  >
                    View flow
                  </button>
                  <button
                    className="rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={runState.status === 'running'}
                    onClick={() => runScenario(scenario.id)}
                    type="button"
                  >
                    {isRunning ? 'Running…' : 'Run scenario'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Selected flow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{selectedScenario.headline}</h2>
            <p className="mt-3 text-neutral-300">{selectedScenario.summary}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {selectedScenario.signals.map((signal) => (
                <div key={signal.label} className={`rounded-xl border p-4 ${stateStyles[signal.state]}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{signal.label}</p>
                  <p className="mt-2 text-sm font-medium">{signal.value}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className={`rounded-2xl border p-6 ${selectedScenario.outcomeTone}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">Final outcome</p>
            <h2 className="mt-4 break-words text-3xl font-semibold tracking-tight">{selectedScenario.outcome}</h2>
            <p className="mt-4 text-sm leading-6 opacity-90">{selectedScenario.operatorMessage}</p>
            <button
              className="mt-6 rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={runState.status === 'running'}
              onClick={() => runScenario()}
              type="button"
            >
              {runState.status === 'running' ? 'Running demo session…' : 'Run this scenario'}
            </button>
            {runState.status === 'complete' ? (
              <p className="mt-4 text-xs opacity-90">
                Safe demo session returned {runState.result.session?.sessionId ?? 'no session created'} with{' '}
                {runState.result.demo.outcome} (simulated HTTP {runState.result.demo.simulatedHttpStatus}).
              </p>
            ) : null}
            {runState.status === 'error' ? <p className="mt-4 text-xs text-rose-100">{runState.error}</p> : null}
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Decision timeline</p>
            <ol className="mt-6 space-y-4">
              {selectedScenario.timeline.map((item, index) => (
                <li key={item.step} className="flex gap-4">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${timelineStyles[item.status]}`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-neutral-100">{item.step}</h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-400">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Audit event preview</p>
              <p className="text-xs text-neutral-500">
                {runState.status === 'complete' ? 'Returned from safe demo API' : 'Preview before running'}
              </p>
            </div>
            <pre className="mt-5 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-6 text-cyan-100">
              {JSON.stringify(auditPreview, null, 2)}
            </pre>
          </article>
        </section>
      </div>
    </main>
  );
}
