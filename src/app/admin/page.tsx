"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Platform scope for documentation
const PLATFORM_SCOPE = {
  supported: ["iOS", "iPadOS", "macOS", "Android"],
  future: ["Windows", "OneSign-style PC"],
};

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
  const [demoStatus, setDemoStatus] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    async function fetchDemoStatus() {
      try {
        const res = await fetch('/api/demo/verify');
        const data = await res.json();
        setDemoStatus({ status: data.status, message: data.message });
      } catch {
        setDemoStatus({ status: 'FAIL', message: 'Demo verification unavailable' });
      }
    }
    fetchDemoStatus();
    const interval = setInterval(fetchDemoStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "events", label: "Security Events", icon: "🚨" },
    { id: "integrations", label: "Integrations", icon: "🔌" },
    { id: "logs", label: "Integration Logs", icon: "📡" },
    { id: "policies", label: "Policies", icon: "📋" },
    { id: "devices", label: "Devices", icon: "📱" },
    { id: "security", label: "Security", icon: "🔐" },
    { id: "receipts", label: "Receipts", icon: "📨" },
    { id: "dlq", label: "DLQ", icon: "📥" },
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
              {demoStatus && (
                <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                  demoStatus.status === 'PASS' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    demoStatus.status === 'PASS' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                  Demo {demoStatus.status === 'PASS' ? 'Ready' : 'Not Ready'}
                </span>
              )}
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
            {activeTab === "events" && (
              <SecurityEventsView />
            )}
            {activeTab === "integrations" && (
              <IntegrationsView />
            )}
            {activeTab === "logs" && (
              <IntegrationLogsView />
            )}
            {activeTab === "policies" && (
              <PoliciesView />
            )}
            {activeTab === "devices" && (
              <DevicesView />
            )}
            {activeTab === "security" && (
              <SecurityView />
            )}
            {activeTab === "receipts" && (
              <ReceiptsView />
            )}
            {activeTab === "dlq" && (
              <DLQView />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Security Events View - fetches real events from API

interface SecurityEvent {
  id: string;
  type: string;
  timestamp: string;
  actor: { type: string; id: string; name?: string };
  device?: { id: string; complianceStatus: string };
  decision: string;
  reason?: string;
  actionsTriggered: string[];
  riskScore?: number;
  policy?: string;
  badgeUid?: string;
  location?: string;
  postureSummary?: string;
}

function SecurityEventsView() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterDecision, setFilterDecision] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDevice, setFilterDevice] = useState<string>("");
  const [filterUser, setFilterUser] = useState<string>("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/admin/security-events?limit=50');
        const data = await res.json();
        setEvents(data.events || []);
        setSummary(data.summary);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = events.filter(e => {
    if (filterDecision !== "all" && e.decision !== filterDecision) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterDevice && !e.device?.id?.toLowerCase().includes(filterDevice.toLowerCase())) return false;
    if (filterUser && !e.actor?.name?.toLowerCase().includes(filterUser.toLowerCase()) && !e.actor?.id?.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDecisionColor = (decision: string) => {
    return decision === 'DENY' ? 'text-red-400' : 'text-emerald-400';
  };

  const getEventTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const getRiskBadgeClass = (score?: number) => {
    if (!score) return '';
    if (score >= 70) return 'bg-red-500/20 text-red-400';
    if (score >= 40) return 'bg-amber-500/20 text-amber-400';
    return 'bg-emerald-500/20 text-emerald-400';
  };

  const getRiskLabel = (score?: number) => {
    if (!score) return '-';
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Events</h2>
          <p className="text-neutral-400">Security decisions and access events</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold">{summary.totalEvents || 0}</div>
            <div className="text-sm text-neutral-400">Total Events</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-400">{summary.denied || 0}</div>
            <div className="text-sm text-neutral-400">Denied</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">{summary.allowed || 0}</div>
            <div className="text-sm text-neutral-400">Allowed</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{summary.quarantined || 0}</div>
            <div className="text-sm text-neutral-400">Quarantined</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{summary.siemAlerts || 0}</div>
            <div className="text-sm text-neutral-400">SIEM Alerts</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400">{summary.itsmTickets || 0}</div>
            <div className="text-sm text-neutral-400">ITSM Tickets</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Decision</label>
            <select 
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="DENY">Denied</option>
              <option value="ALLOW">Allowed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Event Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="session_denied">Session Denied</option>
              <option value="session_allowed">Session Allowed</option>
              <option value="quarantine">Quarantine</option>
              <option value="siem_alert">SIEM Alert</option>
              <option value="itsm_ticket">ITSM Ticket</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Device</label>
            <input 
              type="text"
              placeholder="Filter by device..."
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm w-40"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">User</label>
            <input 
              type="text"
              placeholder="Filter by user..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm w-40"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <div className="text-lg font-medium mb-2">No Security Events</div>
          <div className="text-neutral-400 text-sm">
            Run <code className="bg-neutral-800 px-2 py-1 rounded">bun run demo:exec</code> to generate events
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Date</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Time</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Event</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">User</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Device</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Location</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Posture</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Risk</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Decision</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-neutral-800/30">
                    <td className="px-3 py-3 text-neutral-400 text-sm">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="px-3 py-3 text-neutral-300 font-mono text-sm">
                      {formatTime(event.timestamp)}
                    </td>
                    <td className="px-3 py-3 text-neutral-300 text-sm capitalize">
                      {getEventTypeLabel(event.type)}
                    </td>
                    <td className="px-3 py-3 text-neutral-300 text-sm">
                      {event.actor?.name || event.actor?.id?.split('@')[0] || '-'}
                    </td>
                    <td className="px-3 py-3 text-neutral-400 font-mono text-sm">
                      {event.device?.id || '-'}
                    </td>
                    <td className="px-3 py-3 text-neutral-400 text-sm">
                      {event.location || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {event.device?.complianceStatus ? (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          event.device.complianceStatus === 'compliant' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {event.device.complianceStatus}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-3">
                      {event.riskScore ? (
                        <a href={`/admin/events/${event.id}`}>
                          <span className={`px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 ${getRiskBadgeClass(event.riskScore)}`}>
                            {event.riskScore}
                          </span>
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-semibold text-sm ${getDecisionColor(event.decision)}`}>
                        {event.decision}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {event.actionsTriggered?.slice(0, 2).map((action, i) => (
                          <span key={i} className="px-2 py-0.5 bg-neutral-700 rounded text-xs">
                            {action.replace('_', ' ')}
                          </span>
                        ))}
                        {event.actionsTriggered?.length > 2 && (
                          <span className="text-xs text-neutral-500">+{event.actionsTriggered.length - 2}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Dashboard View
function DashboardView() {
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [integrationLogs, setIntegrationLogs] = useState<any>(null);
  const [glanceState, setGlanceState] = useState<'compliant' | 'due-soon' | 'overdue'>('compliant');
  const [glanceTemplate, setGlanceTemplate] = useState<'healthcare' | 'warehouse' | 'retail'>('healthcare');

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, logsRes] = await Promise.all([
          fetch('/api/admin/security-events?limit=20'),
          fetch('/api/admin/integration-logs'),
        ]);
        const eventsData = await eventsRes.json();
        const logsData = await logsRes.json();
        setEvents(eventsData.events || []);
        setSummary(eventsData.summary);
        setIntegrationLogs(logsData);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const recentEvents = events.slice(0, 10);
  const deniedEvents = events.filter(e => e.decision === 'DENY');
  
  // Top risky devices
  const deviceRisks: Record<string, number> = {};
  for (const e of events) {
    if (e.device?.id && e.riskScore) {
      deviceRisks[e.device.id] = Math.max(deviceRisks[e.device.id] || 0, e.riskScore);
    }
  }
  const topRiskyDevices = Object.entries(deviceRisks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-neutral-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
        <p className="text-neutral-400">Real-time security events and decisions</p>
      </div>

      {/* Executive Summary Cards - Real Data */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{summary?.denied || 0}</div>
            <div className="text-sm text-neutral-400">Sessions Denied</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{summary?.allowed || 0}</div>
            <div className="text-sm text-neutral-400">Sessions Allowed</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{summary?.quarantined || 0}</div>
            <div className="text-sm text-neutral-400">Quarantined</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📡</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">{(summary?.siemAlerts || 0) + (summary?.itsmTickets || 0)}</div>
            <div className="text-sm text-neutral-400">Alerts + Tickets</div>
          </div>
        </div>
      </div>

      {/* Top Risky Devices */}
      {topRiskyDevices.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Risky Devices</h3>
          <div className="space-y-3">
            {topRiskyDevices.map(([deviceId, score]) => (
              <div key={deviceId} className="flex items-center justify-between">
                <span className="font-mono text-sm">{deviceId}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  score >= 70 ? 'bg-red-500/20 text-red-400' :
                  score >= 40 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  Risk: {score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Logs Summary */}
      {integrationLogs && integrationLogs.logs?.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Integration Payloads</h3>
            <Link href="/admin?tab=logs" className="text-emerald-400 text-sm hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SIEM */}
            <div className="bg-neutral-950 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400">📡</span>
                <span className="text-sm font-medium text-blue-400">SIEM Event</span>
              </div>
              {integrationLogs.latestPayloads?.siem ? (
                <pre className="text-xs text-neutral-400 overflow-hidden" style={{ maxHeight: '80px' }}>
                  {JSON.stringify(integrationLogs.latestPayloads.siem, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-neutral-500">No SIEM events yet</div>
              )}
            </div>
            {/* ITSM */}
            <div className="bg-neutral-950 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-400">🎫</span>
                <span className="text-sm font-medium text-purple-400">ITSM Ticket</span>
              </div>
              {integrationLogs.latestPayloads?.itsm ? (
                <pre className="text-xs text-neutral-400 overflow-hidden" style={{ maxHeight: '80px' }}>
                  {JSON.stringify(integrationLogs.latestPayloads.itsm, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-neutral-500">No ITSM tickets yet</div>
              )}
            </div>
            {/* NAC */}
            <div className="bg-neutral-950 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">🔒</span>
                <span className="text-sm font-medium text-amber-400">NAC Command</span>
              </div>
              {integrationLogs.latestPayloads?.nac ? (
                <pre className="text-xs text-neutral-400 overflow-hidden" style={{ maxHeight: '80px' }}>
                  {JSON.stringify(integrationLogs.latestPayloads.nac, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-neutral-500">No NAC commands yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Glance Layer Demo - Device Card Preview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">Glance Layer</h3>
            <p className="text-sm text-neutral-400">Device lock screen surface — one glance to know device status</p>
          </div>
          <div className="flex gap-3">
            {/* Template Toggle */}
            <div className="flex bg-neutral-800 rounded-lg p-1">
              {(['healthcare', 'warehouse', 'retail'] as const).map(template => (
                <button
                  key={template}
                  onClick={() => setGlanceTemplate(template)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    glanceTemplate === template
                      ? 'bg-neutral-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {template === 'healthcare' ? '🏥 Healthcare' : template === 'warehouse' ? '📦 Warehouse' : '🛒 Retail'}
                </button>
              ))}
            </div>
            {/* State Toggle */}
            <div className="flex bg-neutral-800 rounded-lg p-1">
              {(['compliant', 'due-soon', 'overdue'] as const).map(state => (
                <button
                  key={state}
                  onClick={() => setGlanceState(state)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    glanceState === state
                      ? state === 'compliant' ? 'bg-emerald-500 text-white' :
                        state === 'due-soon' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {state === 'compliant' ? '✓' : state === 'due-soon' ? '⚠' : '✕'} {state === 'compliant' ? 'OK' : state === 'due-soon' ? 'Due Soon' : 'Overdue'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Device Card Preview */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Card */}
          <div className="flex-1">
            {glanceTemplate === 'healthcare' && (
              <div className={`rounded-xl overflow-hidden border-2 ${
                glanceState === 'compliant' ? 'border-emerald-500' :
                glanceState === 'due-soon' ? 'border-amber-500' : 'border-red-500'
              }`}>
                <div className={`p-4 ${
                  glanceState === 'compliant' ? 'bg-emerald-900/30' :
                  glanceState === 'due-soon' ? 'bg-amber-900/30' : 'bg-red-900/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏥</span>
                    <span className="font-semibold">St. Mary&apos;s Hospital</span>
                  </div>
                  <div className="text-sm text-neutral-300">iPad — Nurse Station A</div>
                </div>
                <div className="bg-neutral-800 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Checked out to:</span>
                    <span className="font-medium">Dr. Sarah Chen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Role:</span>
                    <span className="font-medium">Emergency Medicine</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Shift:</span>
                    <span className="font-medium">7:00 AM — 7:00 PM</span>
                  </div>
                </div>
                <div className="bg-neutral-800 p-4 border-t border-neutral-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <span className="font-medium">Return to: Nurse Station A Cart #3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏰</span>
                    <span className={`font-semibold ${
                      glanceState === 'compliant' ? 'text-emerald-400' :
                      glanceState === 'due-soon' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {glanceState === 'compliant' ? 'Due back: 6:45 PM (1h 15m)' :
                       glanceState === 'due-soon' ? 'Due back: 5:15 PM (15 min)' :
                       'OVERDUE by 30 min'}
                    </span>
                  </div>
                </div>
                <div className={`p-3 ${
                  glanceState === 'compliant' ? 'bg-emerald-900/50' :
                  glanceState === 'due-soon' ? 'bg-amber-900/50' : 'bg-red-900/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      glanceState === 'compliant' ? 'text-emerald-400' :
                      glanceState === 'due-soon' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {glanceState === 'compliant' ? '✅ Device OK' :
                       glanceState === 'due-soon' ? '⚠️ Due Soon' : '❌ Needs Attention'}
                    </span>
                    <span className="text-xs text-neutral-400">Synced 2 min ago</span>
                  </div>
                </div>
              </div>
            )}

            {glanceTemplate === 'warehouse' && (
              <div className={`rounded-xl overflow-hidden border-2 ${
                glanceState === 'compliant' ? 'border-emerald-500' :
                glanceState === 'due-soon' ? 'border-amber-500' : 'border-red-500'
              }`}>
                <div className={`p-4 ${
                  glanceState === 'compliant' ? 'bg-emerald-900/30' :
                  glanceState === 'due-soon' ? 'bg-amber-900/30' : 'bg-red-900/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📦</span>
                    <span className="font-semibold">Acme Logistics</span>
                  </div>
                  <div className="text-sm text-neutral-300">Handheld Scanner — Zone B</div>
                </div>
                <div className="bg-neutral-800 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Checked out to:</span>
                    <span className="font-medium">Marcus J.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Shift:</span>
                    <span className="font-medium">Day Shift (6A — 6P)</span>
                  </div>
                </div>
                <div className="bg-neutral-800 p-4 border-t border-neutral-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <span className="font-medium">Return to: Zone B Charging Dock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏰</span>
                    <span className={`font-semibold ${
                      glanceState === 'compliant' ? 'text-emerald-400' :
                      glanceState === 'due-soon' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {glanceState === 'compliant' ? 'Shift ends: 6:00 PM (2h 30m)' :
                       glanceState === 'due-soon' ? 'Shift ends: 5:00 PM (30 min)' :
                       'SHIFT ENDED 1h ago'}
                    </span>
                  </div>
                </div>
                <div className={`p-3 ${
                  glanceState === 'compliant' ? 'bg-emerald-900/50' :
                  glanceState === 'due-soon' ? 'bg-amber-900/50' : 'bg-red-900/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <span className="text-sm">🔋 <span className="text-emerald-400 font-medium">78%</span></span>
                      <span className="text-sm">📶 <span className="text-emerald-400 font-medium">Strong</span></span>
                    </div>
                    <span className="text-xs text-neutral-400">Zone B</span>
                  </div>
                </div>
              </div>
            )}

            {glanceTemplate === 'retail' && (
              <div className={`rounded-xl overflow-hidden border-2 ${
                glanceState === 'compliant' ? 'border-emerald-500' :
                glanceState === 'due-soon' ? 'border-amber-500' : 'border-red-500'
              }`}>
                <div className={`p-4 ${
                  glanceState === 'compliant' ? 'bg-emerald-900/30' :
                  glanceState === 'due-soon' ? 'bg-amber-900/30' : 'bg-red-900/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🛒</span>
                    <span className="font-semibold">Target Store #2847</span>
                  </div>
                  <div className="text-sm text-neutral-300">Handheld — Floor</div>
                </div>
                <div className="bg-neutral-800 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Checked out to:</span>
                    <span className="font-medium">Jamie K.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Department:</span>
                    <span className="font-medium">Electronics</span>
                  </div>
                </div>
                <div className="bg-neutral-800 p-4 border-t border-neutral-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <span className="font-medium">Return to: Service Desk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏰</span>
                    <span className={`font-semibold ${
                      glanceState === 'compliant' ? 'text-emerald-400' :
                      glanceState === 'due-soon' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {glanceState === 'compliant' ? 'Due: End of shift' :
                       glanceState === 'due-soon' ? 'Break ends: 2:00 PM (10 min)' :
                       'OVERDUE: Shift ended'}
                    </span>
                  </div>
                </div>
                <div className={`p-3 ${
                  glanceState === 'compliant' ? 'bg-emerald-900/50' :
                  glanceState === 'due-soon' ? 'bg-amber-900/50' : 'bg-red-900/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      glanceState === 'compliant' ? 'text-emerald-400' :
                      glanceState === 'due-soon' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {glanceState === 'compliant' ? '✅ In bounds' :
                       glanceState === 'due-soon' ? '⚠️ Break ending' : '❌ Outside bounds'}
                    </span>
                    <span className="text-xs text-neutral-400">Store #2847</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Why This Matters Panel */}
          <div className="w-full md:w-80">
            <div className="bg-neutral-800 rounded-xl p-5 h-full">
              <h4 className="font-semibold text-neutral-200 mb-4">Why this matters</h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400">👤</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Who has the device</div>
                    <div className="text-xs text-neutral-400 mt-1">Staff instantly know who is responsible</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-emerald-400">📍</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Where it belongs</div>
                    <div className="text-xs text-neutral-400 mt-1">Clear return location eliminates searching</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="text-amber-400">⏰</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-200">When it is due back</div>
                    <div className="text-xs text-neutral-400 mt-1">Countdown prevents overdue devices</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                    <span className="text-red-400">⚡</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Whether it needs attention</div>
                    <div className="text-xs text-neutral-400 mt-1">Color-coded status at a glance</div>
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="mt-4 pt-4 border-t border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🧠</span>
                  <span className="text-sm font-medium text-violet-400">AI Insight</span>
                </div>
                <div className="text-xs text-neutral-400">
                  {glanceState === 'compliant' && 'Device is compliant. No action needed. User can continue session.'}
                  {glanceState === 'due-soon' && glanceTemplate === 'healthcare' && 'Shift ends in 15 min. Recommend prompting user to return device to cart.'}
                  {glanceState === 'due-soon' && glanceTemplate === 'warehouse' && 'Shift ending soon. Device should be returned to Zone B dock.'}
                  {glanceState === 'due-soon' && glanceTemplate === 'retail' && 'Break ending. User should return to Service Desk.'}
                  {glanceState === 'overdue' && glanceTemplate === 'healthcare' && 'Device is overdue. Recommend quarantine and notify IT.'}
                  {glanceState === 'overdue' && glanceTemplate === 'warehouse' && 'Shift has ended. Device overdue - trigger NAC port disable.'}
                  {glanceState === 'overdue' && glanceTemplate === 'retail' && 'Device outside store bounds. Alert security team immediately.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Decisions</h3>
          <Link href="/admin/events" className="text-emerald-400 text-sm hover:underline">
            View All →
          </Link>
        </div>
        {recentEvents.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">
            No events yet. Run <code className="bg-neutral-800 px-2 py-1 rounded">bun run demo:exec</code> to generate events.
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${event.decision === 'DENY' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                  <div>
                    <div className="font-medium">{event.actor?.name || event.actor?.id?.split('@')[0] || 'Unknown'}</div>
                    <div className="text-sm text-neutral-400">{event.device?.id || 'No device'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Link href={`/admin/events/${event.id}`}>
                    <span className={`font-semibold cursor-pointer hover:underline ${event.decision === 'DENY' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {event.decision}
                    </span>
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Security Events View
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

// Integration Logs View - Shows mock integration payloads
function IntegrationLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/integration-logs');
        const data = await res.json();
        setLogs(data.logs || []);
        setSummary(data.summary);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'siem': return '📡';
      case 'itsm': return '🎫';
      case 'nac': return '🔒';
      default: return '📋';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'siem': return 'SIEM Event';
      case 'itsm': return 'ITSM Ticket';
      case 'nac': return 'NAC Command';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Integration Logs</h2>
          <p className="text-neutral-400">Mock integration payloads (demo visibility)</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📡</span>
              <span className="font-semibold">SIEM Events</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{summary.siem}</div>
            <div className="text-sm text-neutral-400">Sent to SIEM</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎫</span>
              <span className="font-semibold">ITSM Tickets</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{summary.itsm}</div>
            <div className="text-sm text-neutral-400">Created in ITSM</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔒</span>
              <span className="font-semibold">NAC Commands</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{summary.nac}</div>
            <div className="text-sm text-neutral-400">Sent to NAC</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📡</div>
          <div className="text-lg font-medium mb-2">No Integration Logs</div>
          <div className="text-neutral-400 text-sm">
            Run <code className="bg-neutral-800 px-2 py-1 rounded">bun run demo:exec</code> to generate integration events
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(log.type)}</span>
                  <span className="font-semibold">{getTypeLabel(log.type)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    log.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <span className="text-sm text-neutral-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="bg-neutral-950 p-3 rounded-lg text-xs text-neutral-300 overflow-x-auto">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Integrations View
function IntegrationsView() {
  const webhookEndpoints = [
    { id: "1", name: "HR System Webhook", url: "https://hr.company.com/webhooks/badge", status: "active", lastSuccess: "2 min ago", lastFailure: "-", retryCount: 0, dlqCount: 0 },
    { id: "2", name: "SIEM Connector", url: "https://siem.company.com/ingest", status: "active", lastSuccess: "5 min ago", lastFailure: "1 hour ago", retryCount: 3, dlqCount: 1 },
    { id: "3", name: "ITSM Integration", url: "https://servicenow.company.com/api", status: "active", lastSuccess: "10 min ago", lastFailure: "-", retryCount: 0, dlqCount: 0 },
  ];

  const itsmVendors = [
    { name: "ServiceNow", status: "configured", type: "ITSM" },
    { name: "Jira", status: "not_configured", type: "ITSM" },
    { name: "Splunk", status: "configured", type: "SIEM" },
    { name: "Microsoft Sentinel", status: "not_configured", type: "SIEM" },
    { name: "Intune", status: "configured", type: "UEM" },
    { name: "Jamf", status: "not_configured", type: "UEM" },
    { name: "Aruba ClearPass", status: "configured", type: "NAC" },
    { name: "FleetDM", status: "configured", type: "Telemetry" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Integrations</h2>
        <p className="text-neutral-400">Configure webhooks, ITSM, SIEM, UEM, NAC, and FleetDM integrations</p>
      </div>

      {/* Webhook Endpoints */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
          <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium">
            + Add Endpoint
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">URL</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Last Success</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Last Failure</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Retries</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">DLQ</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {webhookEndpoints.map((endpoint) => (
              <tr key={endpoint.id} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3 font-medium">{endpoint.name}</td>
                <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{endpoint.url}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400">Active</span>
                </td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{endpoint.lastSuccess}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{endpoint.lastFailure}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{endpoint.retryCount}</td>
                <td className="px-4 py-3">
                  {endpoint.dlqCount > 0 ? (
                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">{endpoint.dlqCount}</span>
                  ) : (
                    <span className="text-neutral-500">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="text-emerald-400 hover:text-emerald-300 text-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {itsmVendors.map((vendor) => (
          <div key={vendor.name} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{vendor.name}</span>
              <span className="text-xs text-neutral-500">{vendor.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded ${
                vendor.status === "configured" 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-neutral-700 text-neutral-400"
              }`}>
                {vendor.status === "configured" ? "Configured" : "Not Configured"}
              </span>
              <button className="text-sm text-emerald-400 hover:text-emerald-300">
                {vendor.status === "configured" ? "Configure" : "Set Up"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Scope */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Scope</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Supported:</span>
            {PLATFORM_SCOPE.supported.map(p => (
              <span key={p} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">{p}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Future:</span>
            {PLATFORM_SCOPE.future.map(p => (
              <span key={p} className="px-2 py-1 bg-neutral-700 text-neutral-400 rounded text-xs">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Policies View
function PoliciesView() {
  const policies = [
    { id: "1", name: "Executive Access", enabled: true, priority: 1, conditions: "user.role = Executive", actions: "launch_app, set_session_ttl", lastMatched: "5 min ago", lastExecuted: "5 min ago" },
    { id: "2", name: "Contractor Restrictions", enabled: true, priority: 2, conditions: "user.role = Contractor", actions: "set_session_ttl=60", lastMatched: "1 hour ago", lastExecuted: "1 hour ago" },
    { id: "3", name: "High Security Zone", enabled: false, priority: 3, conditions: "location.zone = secure_area", actions: "require_step_up_auth", lastMatched: "-", lastExecuted: "-" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Policies</h2>
          <p className="text-neutral-400">Manage authentication and access policies</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium">
          + Create Policy
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Enabled</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Priority</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Conditions</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Actions</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Last Matched</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Last Executed</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3 font-medium">{policy.name}</td>
                <td className="px-4 py-3">
                  <button className={`w-10 h-5 rounded-full transition-colors ${
                    policy.enabled ? "bg-emerald-500" : "bg-neutral-600"
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      policy.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  <input 
                    type="number" 
                    defaultValue={policy.priority} 
                    className="w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3 text-neutral-400 text-sm font-mono">{policy.conditions}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{policy.actions}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{policy.lastMatched}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{policy.lastExecuted}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-emerald-400 hover:text-emerald-300 text-sm">Edit</button>
                    <button className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Security View
function SecurityView() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Security</h2>
        <p className="text-neutral-400">WebAuthn, step-up authentication, and high-risk action protection</p>
      </div>

      {/* WebAuthn Status */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">WebAuthn Registration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-emerald-400">12</div>
            <div className="text-neutral-400 text-sm">Registered Credentials</div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-3xl font-bold">8</div>
            <div className="text-neutral-400 text-sm">Active Users</div>
          </div>
        </div>
        <button className="mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm">
          View All Credentials
        </button>
      </div>

      {/* Step-Up Enforcement */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Step-Up Enforcement</h3>
        <div className="space-y-4">
          {[
            { action: "webhook_secret_rotate", protected: true },
            { action: "policy_edit", protected: true },
            { action: "policy_enable", protected: true },
            { action: "device_quarantine", protected: true },
            { action: "admin_delete", protected: true },
          ].map((item) => (
            <div key={item.action} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
              <span className="font-mono text-sm">{item.action}</span>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Protected</span>
            </div>
          ))}
        </div>
      </div>

      {/* High-Risk Actions Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">High-Risk Action Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">45</div>
            <div className="text-neutral-400 text-sm">Actions Today</div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">43</div>
            <div className="text-neutral-400 text-sm">Step-Up Verified</div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">2</div>
            <div className="text-neutral-400 text-sm">Pending Verification</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delivery Receipts View
function ReceiptsView() {
  // Demo-friendly receipts that tell a story for executive demos
  const receipts = [
    { 
      id: "1", 
      type: "webhook", 
      event: "session.start", 
      status: "success", 
      deviceId: "iPad-Nurse-Station-01", 
      user: "jane.nurse@hospital.org",
      correlationId: "evt-20240315-001", 
      timestamp: "2 min ago" 
    },
    { 
      id: "2", 
      type: "siem.event", 
      event: "session.start", 
      status: "success", 
      deviceId: "iPad-Nurse-Station-01", 
      user: "jane.nurse@hospital.org",
      correlationId: "evt-20240315-001", 
      timestamp: "2 min ago" 
    },
    { 
      id: "3", 
      type: "itsm.ticket", 
      event: "policy.violation.detected", 
      status: "success", 
      deviceId: "iPad-Nurse-Station-01", 
      user: "jane.nurse@hospital.org",
      correlationId: "evt-20240315-002", 
      timestamp: "3 min ago" 
    },
    { 
      id: "4", 
      type: "policy.action", 
      event: "device.quarantine", 
      status: "success", 
      deviceId: "iPad-Nurse-Station-01", 
      user: "System",
      correlationId: "evt-20240315-002", 
      timestamp: "3 min ago" 
    },
    { 
      id: "5", 
      type: "nac.command", 
      event: "quarantine.issued", 
      status: "success", 
      deviceId: "iPad-Nurse-Station-01", 
      user: "System",
      correlationId: "evt-20240315-003", 
      timestamp: "4 min ago" 
    },
    { 
      id: "6", 
      type: "webhook", 
      event: "session.end", 
      status: "success", 
      deviceId: "POS-Tablet-Store-42", 
      user: "bob.cashier@retail.com",
      correlationId: "evt-20240315-010", 
      timestamp: "15 min ago" 
    },
    { 
      id: "7", 
      type: "webhook", 
      event: "session.end", 
      status: "success", 
      deviceId: "Android-Warehouse-07", 
      user: "mike.warehouse@logistics.com",
      correlationId: "evt-20240315-015", 
      timestamp: "20 min ago" 
    },
  ];

  // Demo story explanation for executives
  const demoStory = {
    title: "Demo Story: Shared Device Policy Violation",
    steps: [
      "1. Nurse badges into shared iPad at nurse station",
      "2. FleetDM reports device out of compliance (jailbroken)",
      "3. Policy triggers: quarantine_device + create_itsm_ticket",
      "4. SIEM event sent to security team",
      "5. NAC enforces network quarantine"
    ]
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Delivery Receipts</h2>
        <p className="text-neutral-400">Webhook, ITSM, SIEM, and policy action events</p>
      </div>

      {/* Demo Story Card */}
      <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3 text-emerald-400">{demoStory.title}</h3>
        <div className="space-y-2">
          {demoStory.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-neutral-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input 
          placeholder="Filter by correlationId..." 
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2"
        />
        <input 
          placeholder="Filter by deviceId..." 
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2"
        />
        <select className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2">
          <option>All Types</option>
          <option>Webhook</option>
          <option>ITSM</option>
          <option>SIEM</option>
          <option>Policy</option>
        </select>
        <select className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2">
          <option>All Status</option>
          <option>Success</option>
          <option>Failed</option>
        </select>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Event</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Device ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Correlation ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {receipts.map((receipt) => (
              <tr key={receipt.id} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-neutral-700 rounded text-xs">{receipt.type}</span>
                </td>
                <td className="px-4 py-3 text-neutral-300 font-mono text-sm">{receipt.event}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    receipt.status === "success" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {receipt.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300 font-mono text-sm">{(receipt as any).user || '-'}</td>
                <td className="px-4 py-3 text-neutral-400 font-mono text-sm">{receipt.deviceId}</td>
                <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{receipt.correlationId}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{receipt.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// DLQ View
function DLQView() {
  const dlqItems = [
    { id: "1", webhook: "SIEM Connector", reason: "Connection timeout", payloadPreview: "{ \"event\": \"session.start\", ... }", timestamp: "1 hour ago", retryCount: 5 },
    { id: "2", webhook: "HR System", reason: "HTTP 500", payloadPreview: "{ \"badgeId\": \"ABC123\", ... }", timestamp: "2 hours ago", retryCount: 3 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Dead Letter Queue</h2>
        <p className="text-neutral-400">Failed webhook deliveries pending retry or manual intervention</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Webhook</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Reason</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Payload Preview</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Timestamp</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Retries</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {dlqItems.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3 font-medium">{item.webhook}</td>
                <td className="px-4 py-3 text-red-400 text-sm">{item.reason}</td>
                <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{item.payloadPreview}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{item.timestamp}</td>
                <td className="px-4 py-3 text-neutral-400">{item.retryCount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs">Replay</button>
                    <button className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs">View</button>
                    <button className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Devices View (Enhanced)
function DevicesView() {
  const devices = [
    { deviceId: "device-001", serial: "C02X1234ABCD", platform: "iOS", lastSeen: "2 min ago", posture: "Compliant", locationZone: "Lobby", quarantined: false, mgmtSource: "Intune" },
    { deviceId: "device-002", serial: "C02Y5678EFGH", platform: "macOS", lastSeen: "5 min ago", posture: "Compliant", locationZone: "Office A", quarantined: false, mgmtSource: "Jamf" },
    { deviceId: "device-003", serial: "C02Z9012IJKL", platform: "Android", lastSeen: "1 hour ago", posture: "Unknown", locationZone: "-", quarantined: true, mgmtSource: "Intune" },
    { deviceId: "device-004", serial: "C02A3456MNOP", platform: "iPadOS", lastSeen: "10 min ago", posture: "Non-compliant", locationZone: "Office B", quarantined: false, mgmtSource: "Jamf" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Devices</h2>
        <p className="text-neutral-400">Manage enrolled kiosk devices, compliance, and quarantine state</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Device ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Serial</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Platform</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Last Seen</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Posture</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Location Zone</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Quarantine</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Mgmt Source</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {devices.map((device) => (
              <tr key={device.deviceId} className="hover:bg-neutral-800/30">
                <td className="px-4 py-3 font-mono text-sm">{device.deviceId}</td>
                <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{device.serial}</td>
                <td className="px-4 py-3">{device.platform}</td>
                <td className="px-4 py-3 text-neutral-400 text-sm">{device.lastSeen}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    device.posture === "Compliant" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : device.posture === "Non-compliant"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-neutral-700 text-neutral-400"
                  }`}>
                    {device.posture}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400">{device.locationZone}</td>
                <td className="px-4 py-3">
                  {device.quarantined ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Quarantined</span>
                  ) : (
                    <span className="text-neutral-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-400">{device.mgmtSource}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {device.quarantined ? (
                      <button className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs">Clear</button>
                    ) : (
                      <button className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs">Quarantine</button>
                    )}
                    <button className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs">Sync</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
