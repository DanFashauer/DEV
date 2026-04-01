const slides = [
  {
    number: '01',
    title: 'Title',
    heading: 'SignalGrid',
    subheading: 'The Decision Layer for Enterprise Risk',
    bullets: ['Decide before risk becomes impact'],
    talkTrack:
      'SignalGrid is a new enterprise security control plane that transforms fragmented signals into immediate enforcement decisions across identity, device, and access.',
    vcQuestion: 'What company are you really becoming?',
    vcAnswer:
      'A control-plane company: the real-time decision and enforcement layer for enterprise risk.',
    visual: 'hero',
  },
  {
    number: '02',
    title: 'Problem — The Decision Gap',
    heading: 'Enterprises have a decision problem',
    bullets: ['Tools detect', 'Dashboards visualize', 'ITSM reacts'],
    talkTrack:
      'The gap between signal and action is where preventable incidents happen. Existing systems explain what happened, but they do not decide in real time.',
    vcQuestion: 'Why is this not already solved by SIEM/XDR?',
    vcAnswer:
      'Because those systems optimize for detection and investigation, not pre-event policy decisions and enforcement.',
    visual: 'gap',
  },
  {
    number: '03',
    title: 'Why Now',
    heading: 'Continuous trust requires real-time decisions',
    bullets: ['Identity is the new perimeter', 'Device trust now drives access', 'AI increases execution speed'],
    talkTrack:
      'More machine actors, unmanaged devices, and automation compress response windows. Enterprises now need milliseconds, not minutes.',
    vcQuestion: 'Why will buyers care now?',
    vcAnswer: 'The cost of delayed decisions is increasing now in real production environments.',
    visual: 'trend',
  },
  {
    number: '04',
    title: 'Category Thesis — Decision Layer',
    heading: 'Others detect. SignalGrid decides and enforces.',
    bullets: ['Unify context', 'Score trust in real time', 'Enforce before risky actions complete'],
    talkTrack:
      'SignalGrid defines a new control plane between detection and impact: the dedicated Decision Layer for Enterprise Risk.',
    vcQuestion: 'Is this a feature or a standalone company?',
    vcAnswer: 'Standalone. It spans multiple systems of record and enforcement points across mixed enterprise stacks.',
    visual: 'layer',
  },
  {
    number: '05',
    title: 'Product — 3-Layer Architecture',
    heading: 'Unified Context + Decision Engine + Enforcement Layer',
    bullets: ['Identity, device, behavior, risk', 'Policy + trust scoring + AI reasoning', 'Allow / deny / step-up / workflow trigger'],
    talkTrack:
      'The product normalizes fragmented signals into an explainable decision graph and converts policy into immediate action.',
    vcQuestion: 'Where is the moat?',
    vcAnswer: 'Reliable cross-stack normalization plus low-latency, explainable decisions tied to real enforcement.',
    visual: 'architecture',
  },
  {
    number: '06',
    title: 'How It Works — Workflow',
    heading: 'Signal ingest → context → trust score → decision → enforcement',
    bullets: ['Unmanaged device attempts login', 'Trust score drops below threshold', 'Step-up or deny instantly with audit trail'],
    talkTrack:
      'SignalGrid closes the loop before impact: no delayed triage, no unnecessary ticket churn.',
    vcQuestion: 'What is the first workflow customers buy?',
    vcAnswer: 'High-risk access decisions tied to identity and device posture.',
    visual: 'workflow',
  },
  {
    number: '07',
    title: 'Differentiation — IAM vs SIEM vs ITSM',
    heading: 'SignalGrid sits between signal and impact',
    bullets: ['IAM authenticates', 'SIEM investigates', 'ITSM coordinates'],
    talkTrack:
      'We do not replace the stack. We orchestrate it by deciding whether risky actions should proceed.',
    vcQuestion: 'Why not Microsoft or Okta?',
    vcAnswer: 'They can cover segments in their ecosystems; SignalGrid is purpose-built for mixed enterprise environments.',
    visual: 'matrix',
  },
  {
    number: '08',
    title: 'ICP + Beachhead',
    heading: 'Initial buyers are platform, identity, and endpoint teams',
    bullets: ['Platform engineering', 'Identity and access teams', 'Endpoint / UEM leaders'],
    talkTrack:
      'These teams control enforcement systems and can deploy quickly without SOC-centric process bottlenecks.',
    vcQuestion: 'Why start outside SOC?',
    vcAnswer: 'Because these owners have the authority and urgency to operationalize this first.',
    visual: 'icp',
  },
  {
    number: '09',
    title: 'TAM Narrative',
    heading: 'A cross-functional control-plane opportunity',
    bullets: ['Budget already exists across IAM, UEM, SIEM, ITSM', 'No incumbent owns cross-stack decisioning', 'New software layer can emerge'],
    talkTrack:
      'SignalGrid monetizes measurable value created across existing budgets while expanding into broader trust governance.',
    vcQuestion: 'How do you avoid TAM overreach?',
    vcAnswer: 'Start narrow with enterprise access workflows; expand deliberately into adjacent decision domains.',
    visual: 'tam',
  },
  {
    number: '10',
    title: 'GTM Wedge — Land and Expand',
    heading: 'Land with one painful workflow, expand into control-plane ownership',
    bullets: ['Land: risky device access decisions', 'Prove: fewer incidents and fewer tickets', 'Expand: privileged, app, API, and workflow decisioning'],
    talkTrack:
      'Adoption is realistic because we integrate into existing systems and prove value before platform expansion.',
    vcQuestion: 'What makes adoption realistic?',
    vcAnswer: 'No rip-and-replace. One visible workflow, fast ROI, then controlled expansion.',
    visual: 'funnel',
  },
  {
    number: '11',
    title: 'Traction Plan — Pilot Metrics',
    heading: 'Pilot outcomes, not vanity metrics',
    bullets: ['Target fewer preventable incidents', 'Target fewer manual tickets', 'Track latency, enforcement success, and coverage'],
    talkTrack:
      'Early traction focuses on validated enterprise outcomes and repeatable proof points.',
    vcQuestion: 'What makes a pilot compelling?',
    vcAnswer: 'Faster decisions, stronger enforcement coverage, and clear reductions in manual incident handling.',
    visual: 'metrics',
  },
  {
    number: '12',
    title: 'Fundraise + Closing',
    heading: 'Stop reacting. Start deciding.',
    bullets: ['Build the category-defining decision control plane', 'Win the enterprise access beachhead', 'Scale into enterprise trust fabric'],
    talkTrack:
      'This raise funds product hardening, design-partner pilots, deep integrations, and repeatable GTM for the beachhead workflow.',
    vcQuestion: 'What does this round fund?',
    vcAnswer: 'Category validation through real customer outcomes, not feature sprawl.',
    visual: 'close',
  },
];

function Placeholder({ type }: { type: string }) {
  return (
    <div className="rounded-xl border border-cyan-400/30 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">Placeholder visual</span>
        <span className="text-xs text-slate-400">{type}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-16 rounded bg-cyan-500/20" />
        <div className="h-16 rounded bg-indigo-500/20" />
        <div className="h-16 rounded bg-emerald-500/20" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto mb-6 max-w-6xl">
        <h1 className="text-3xl font-semibold">SignalGrid Investor Deck Flow</h1>
        <p className="mt-2 text-sm text-slate-400">
          Founder-ready 12-slide structure with minimal copy, dark enterprise styling, and placeholder chart/icon blocks.
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6">
        {slides.map((slide) => (
          <section key={slide.number} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-[0.2em] text-cyan-300">Slide {slide.number}</p>
              <p className="text-xs text-slate-400">VC Script + Q&A</p>
            </div>

            <h2 className="text-xl font-semibold text-white">{slide.title}</h2>
            <h3 className="mt-1 text-lg text-cyan-200">{slide.heading}</h3>
            {slide.subheading ? <p className="mt-1 text-slate-300">{slide.subheading}</p> : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <ul className="space-y-2">
                  {slide.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-slate-200">
                      <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">30-second talk track</p>
                  <p className="mt-2 text-sm text-slate-200">{slide.talkTrack}</p>
                </div>

                <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Likely VC question</p>
                  <p className="mt-2 text-sm text-slate-200">{slide.vcQuestion}</p>
                  <p className="mt-2 text-sm text-cyan-100">{slide.vcAnswer}</p>
                </div>
              </div>

              <Placeholder type={slide.visual} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
