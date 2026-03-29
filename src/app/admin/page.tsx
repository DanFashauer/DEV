"use client";

import { useEffect, useState } from "react";
import {
  DashboardView,
  DevicesView,
  DLQView,
  IntegrationLogsView,
  IntegrationsView,
  PoliciesView,
  ReceiptsView,
  SecurityEventsView,
  SecurityView,
} from "./adminViews";

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
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

          <main className="flex-1">
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "events" && <SecurityEventsView />}
            {activeTab === "integrations" && <IntegrationsView />}
            {activeTab === "logs" && <IntegrationLogsView />}
            {activeTab === "policies" && <PoliciesView />}
            {activeTab === "devices" && <DevicesView />}
            {activeTab === "security" && <SecurityView />}
            {activeTab === "receipts" && <ReceiptsView />}
            {activeTab === "dlq" && <DLQView />}
          </main>
        </div>
      </div>
    </div>
  );
}
