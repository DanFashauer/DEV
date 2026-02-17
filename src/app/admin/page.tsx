"use client";

import { useState } from "react";

// Flow step types
interface FlowStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  status: "active" | "completed" | "pending" | "error";
}

interface Persona {
  id: string;
  name: string;
  description: string;
  mdmAttributes: Record<string, string>;
  accessLevel: string;
  apps: string[];
  restrictions: string[];
}

// Sample flow data
const authFlowSteps: FlowStep[] = [
  {
    id: "badge",
    label: "Badge Scan",
    description: "User presents badge to reader",
    icon: "🪪",
    status: "active",
  },
  {
    id: "validate",
    label: "Validate Badge",
    description: "Verify badge format and security",
    icon: "✓",
    status: "pending",
  },
  {
    id: "mdm",
    label: "MDM Lookup",
    description: "Query MDM for user profile",
    icon: "🔍",
    status: "pending",
  },
  {
    id: "persona",
    label: "Build Persona",
    description: "Create access persona from MDM",
    icon: "👤",
    status: "pending",
  },
  {
    id: "auth",
    label: "Authenticate",
    description: "Verify identity with IdP",
    icon: "🔐",
    status: "pending",
  },
  {
    id: "mfa",
    label: "MFA Check",
    description: "Optional MFA verification",
    icon: "🛡️",
    status: "pending",
  },
  {
    id: "session",
    label: "Create Session",
    description: "Establish kiosk session",
    icon: "📱",
    status: "pending",
  },
  {
    id: "launch",
    label: "Launch Apps",
    description: "Start permitted applications",
    icon: "🚀",
    status: "pending",
  },
];

// Sample personas
const samplePersonas: Persona[] = [
  {
    id: "1",
    name: "Employee",
    description: "Standard employee with basic access",
    mdmAttributes: {
      department: "Any",
      employeeType: "Full-time",
      deviceOwner: "Corporate",
    },
    accessLevel: "Standard",
    apps: ["Email", "Calendar", "Slack", "Chrome", "Teams"],
    restrictions: ["No App Store", "No iTunes", "Single App Mode"],
  },
  {
    id: "2",
    name: "Contractor",
    description: "Contractor with limited access",
    mdmAttributes: {
      department: "Any",
      employeeType: "Contractor",
      deviceOwner: "Corporate",
    },
    accessLevel: "Restricted",
    apps: ["Email", "Calendar", "Slack"],
    restrictions: [
      "No App Store",
      "No iTunes",
      "Single App Mode",
      "No Camera",
      "No Files",
    ],
  },
  {
    id: "3",
    name: "Executive",
    description: "Executive with elevated privileges",
    mdmAttributes: {
      department: "Executive",
      employeeType: "Full-time",
      deviceOwner: "Corporate",
    },
    accessLevel: "Elevated",
    apps: [
      "Email",
      "Calendar",
      "Slack",
      "Chrome",
      "Teams",
      "Confluence",
      "Jira",
    ],
    restrictions: ["No App Store", "No iTunes"],
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFlowStep, setSelectedFlowStep] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>(samplePersonas);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "flows", label: "Auth Flows", icon: "🔀" },
    { id: "personas", label: "Personas", icon: "👥" },
    { id: "providers", label: "Providers", icon: "🔌" },
    { id: "devices", label: "Devices", icon: "📱" },
    { id: "audit", label: "Audit Log", icon: "📋" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ES</span>
              </div>
              <h1 className="text-xl font-semibold">EnterpriseShell Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                ● Connected
              </span>
              <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                <span className="text-sm">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 shrink-0">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === "dashboard" && (
              <DashboardView />
            )}
            {activeTab === "flows" && (
              <FlowView
                steps={authFlowSteps}
                selectedStep={selectedFlowStep}
                onSelectStep={setSelectedFlowStep}
              />
            )}
            {activeTab === "personas" && (
              <PersonaView
                personas={personas}
                selectedPersona={selectedPersona}
                onSelectPersona={setSelectedPersona}
              />
            )}
            {activeTab === "providers" && <ProviderView />}
            {activeTab === "devices" && <DevicesView />}
            {activeTab === "audit" && <AuditView />}
          </main>
        </div>
      </div>
    </div>
  );
}

// Dashboard View
function DashboardView() {
  const stats = [
    { label: "Active Sessions", value: "24", change: "+3", icon: "📱" },
    { label: "Devices Enrolled", value: "156", change: "+12", icon: "📲" },
    { label: "Auth Today", value: "1,247", change: "+18%", icon: "🔐" },
    { label: "Failed Attempts", value: "3", change: "-50%", icon: "⚠️" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
        <p className="text-neutral-400">Overview of your EnterpriseShell kiosk deployment</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span
                className={`text-sm ${
                  stat.change.startsWith("+")
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-neutral-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { time: "2 min ago", action: "Session started", user: "john.doe@company.com", device: "iPad Pro" },
            { time: "5 min ago", action: "MFA verified", user: "jane.smith@company.com", device: "iPad Air" },
            { time: "12 min ago", action: "Persona built", user: "bob.wilson@company.com", device: "iPad Mini" },
            { time: "18 min ago", action: "Session ended", user: "alice.johnson@company.com", device: "iPad Pro" },
            { time: "25 min ago", action: "MDM enrollment", user: "charlie.brown@company.com", device: "iPad Pro" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-neutral-400">{activity.user}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-300">{activity.device}</div>
                <div className="text-xs text-neutral-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Auth Flows View
function FlowView({
  steps,
  selectedStep,
  onSelectStep,
}: {
  steps: FlowStep[];
  selectedStep: string | null;
  onSelectStep: (id: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Authentication Flows</h2>
        <p className="text-neutral-400">Visualize and configure the authentication flow</p>
      </div>

      {/* Flow Graph */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6">Auth Flow Graph</h3>
        
        {/* Graph Visualization */}
        <div className="relative">
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: steps.length * 80 }}>
            {steps.slice(0, -1).map((_, i) => (
              <line
                key={i}
                x1="50%"
                y1={(i + 1) * 80 - 20}
                x2="50%"
                y2={(i + 2) * 80 - 60}
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-700"
              />
            ))}
          </svg>

          {/* Flow Steps */}
          <div className="space-y-4 relative">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => onSelectStep(selectedStep === step.id ? null : step.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  selectedStep === step.id
                    ? "bg-emerald-500/20 border-emerald-500"
                    : step.status === "completed"
                    ? "bg-emerald-900/30 border-emerald-500/50"
                    : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                }`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-neutral-800 shrink-0">
                  {step.icon}
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {step.label}
                    {step.status === "completed" && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">✓</span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">{step.description}</div>
                </div>
                <div className="text-neutral-500 text-sm">Step {index + 1}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Details */}
      {selectedStep && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Step Details: {steps.find((s) => s.id === selectedStep)?.label}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400">Enabled</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-500" />
                <span className="text-sm">This step is active in the flow</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Timeout (seconds)</label>
              <input type="number" defaultValue={30} className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-neutral-400">On Failure</label>
              <select className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm">
                <option>Block access</option>
                <option>Retry</option>
                <option>Skip step</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Persona View
function PersonaView({
  personas,
  selectedPersona,
  onSelectPersona,
}: {
  personas: Persona[];
  selectedPersona: Persona | null;
  onSelectPersona: (persona: Persona | null) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Persona Builder</h2>
          <p className="text-neutral-400">Build personas from MDM attributes</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">
          + Create Persona
        </button>
      </div>

      {/* MDM Attribute Mapping */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">MDM Attribute Mapping</h3>
        <p className="text-sm text-neutral-400 mb-6">
          Map MDM attributes to automatically build personas based on device/user enrollment data
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { attr: "department", label: "Department", example: "Engineering, Sales, HR" },
            { attr: "employeeType", label: "Employee Type", example: "Full-time, Contractor, Intern" },
            { attr: "deviceOwner", label: "Device Owner", example: "Corporate, Personal, Shared" },
            { attr: "title", label: "Job Title", example: "Manager, Engineer, Director" },
            { attr: "location", label: "Location", example: "Building A, Floor 2, Remote" },
            { attr: "costCenter", label: "Cost Center", example: "CC-12345" },
          ].map((mapping) => (
            <div key={mapping.attr} className="bg-neutral-800 rounded-lg p-4">
              <div className="font-medium mb-1">{mapping.label}</div>
              <div className="text-sm text-neutral-400">MDM: <code className="bg-neutral-700 px-1.5 py-0.5 rounded">{mapping.attr}</code></div>
              <div className="text-xs text-neutral-500 mt-2">Example: {mapping.example}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Personas Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Defined Personas</h3>
        <div className="grid gap-4">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => onSelectPersona(selectedPersona?.id === persona.id ? null : persona)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedPersona?.id === persona.id
                  ? "bg-emerald-500/20 border-emerald-500"
                  : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">{persona.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  persona.accessLevel === "Elevated" ? "bg-purple-500/20 text-purple-400" :
                  persona.accessLevel === "Restricted" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-blue-500/20 text-blue-400"
                }`}>
                  {persona.accessLevel}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-3">{persona.description}</p>
              
              {selectedPersona?.id === persona.id && (
                <div className="space-y-3 pt-3 border-t border-neutral-700">
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">MDM Attributes</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(persona.mdmAttributes).map(([key, value]) => (
                        <span key={key} className="text-xs bg-neutral-700 px-2 py-1 rounded">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Allowed Apps</div>
                    <div className="flex flex-wrap gap-1">
                      {persona.apps.map((app) => (
                        <span key={app} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1">Restrictions</div>
                    <div className="flex flex-wrap gap-1">
                      {persona.restrictions.map((restriction) => (
                        <span key={restriction} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          {restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Provider Configuration View
function ProviderView() {
  const providers = [
    { category: "Badge Reader", options: ["USB", "Bluetooth LE", "NFC", "Serial", "Keyboard Wedge", "HTTP Webhook", "MDM Enrollment"] },
    { category: "Identity Provider", options: ["OIDC (Microsoft Entra ID)", "OIDC (Okta)", "SAML", "MDM Linked", "MFA Required"] },
    { category: "MDM Provider", options: ["Jamf", "Microsoft Intune", "Workspace ONE", "BlackBerry UEM", "Mosyle", "Kandji"] },
    { category: "MFA Provider", options: ["Duo Security", "RSA SecurID", "Okta MFA", "Microsoft MFA", "None"] },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Provider Configuration</h2>
        <p className="text-neutral-400">Configure badge reader, identity, MDM, and MFA providers</p>
      </div>

      {providers.map((provider) => (
        <div key={provider.category} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">{provider.category}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {provider.options.map((option) => (
              <button
                key={option}
                className="p-3 rounded-lg border text-sm transition-colors hover:border-emerald-500 hover:bg-emerald-500/10"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Environment Variables Preview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Environment Configuration</h3>
        <div className="bg-neutral-950 rounded-lg p-4 font-mono text-sm">
          <div className="text-neutral-400"># Badge Reader Configuration</div>
          <div><span className="text-purple-400">BADGE_READER_TYPE</span>=<span className="text-emerald-400">&quot;usb&quot;</span></div>
          <div className="mt-2 text-neutral-400"># Identity Provider Configuration</div>
          <div><span className="text-purple-400">IDENTITY_PROVIDER_TYPE</span>=<span className="text-emerald-400">&quot;oidc&quot;</span></div>
          <div><span className="text-purple-400">OIDC_ISSUER</span>=<span className="text-emerald-400">&quot;https://login.microsoftonline.com/your-tenant-id&quot;</span></div>
          <div className="mt-2 text-neutral-400"># MDM Configuration</div>
          <div><span className="text-purple-400">MDM_PROVIDER</span>=<span className="text-emerald-400">&quot;jamf&quot;</span></div>
          <div><span className="text-purple-400">MDM_API_URL</span>=<span className="text-emerald-400">&quot;https://your-company.jamfcloud.com&quot;</span></div>
          <div className="mt-2 text-neutral-400"># MFA Configuration</div>
          <div><span className="text-purple-400">MFA_PROVIDER</span>=<span className="text-emerald-400">&quot;duo&quot;</span></div>
        </div>
      </div>
    </div>
  );
}

// Devices View
function DevicesView() {
  const devices = [
    { name: "iPad Pro 12.9", serial: "C02X1234ABCD", status: "Active", user: "John Doe", persona: "Employee" },
    { name: "iPad Air", serial: "C02Y5678EFGH", status: "Active", user: "Jane Smith", persona: "Executive" },
    { name: "iPad Mini", serial: "C02Z9012IJKL", status: "Enrolling", user: "Pending", persona: "-" },
    { name: "iPad Pro 11", serial: "C02A3456MNOP", status: "Locked", user: "Bob Wilson", persona: "Contractor" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Devices</h2>
        <p className="text-neutral-400">Manage enrolled kiosk devices</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Device</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Serial</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Persona</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {devices.map((device) => (
              <tr key={device.serial} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3 font-medium">{device.name}</td>
                <td className="px-4 py-3 text-neutral-400 font-mono text-sm">{device.serial}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    device.status === "Active" ? "bg-emerald-500/20 text-emerald-400" :
                    device.status === "Enrolling" ? "bg-blue-500/20 text-blue-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300">{device.user}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-400">{device.persona}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Audit Log View
function AuditView() {
  const logs = [
    { timestamp: "2026-02-17 10:45:23", event: "SESSION_START", user: "john.doe@company.com", details: "Persona: Employee" },
    { timestamp: "2026-02-17 10:44:12", event: "BADGE_VALIDATED", user: "john.doe@company.com", details: "Badge: ABC123" },
    { timestamp: "2026-02-17 10:44:10", event: "MDM_LOOKUP", user: "john.doe@company.com", details: "Jamf: Profile applied" },
    { timestamp: "2026-02-17 10:44:08", event: "PERSONA_BUILT", user: "john.doe@company.com", details: "Attributes: department=Engineering" },
    { timestamp: "2026-02-17 10:30:45", event: "SESSION_END", user: "jane.smith@company.com", details: "Duration: 45 min" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Audit Log</h2>
        <p className="text-neutral-400">Security and authentication events</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Timestamp</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Event</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3 text-neutral-400 font-mono text-sm">{log.timestamp}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-neutral-700 rounded text-xs font-medium">{log.event}</span>
                </td>
                <td className="px-4 py-3 text-neutral-300">{log.user}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
