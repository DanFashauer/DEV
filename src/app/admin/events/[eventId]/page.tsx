"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EventDetail {
  id: string;
  type: string;
  timestamp: string;
  actor: { type: string; id: string; name?: string };
  device?: { id: string; complianceStatus: string };
  decision: string;
  reason?: string;
  actionsTriggered: string[];
  riskScore?: number;
  riskLevel?: string;
  policy?: string;
  badgeUid?: string;
  location?: string;
  postureSummary?: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ eventId: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  const eventId = resolvedParams?.eventId;
  
  useEffect(() => {
    if (!eventId) return;
    
    async function fetchEvent() {
      try {
        const res = await fetch('/api/admin/security-events?limit=50');
        const data = await res.json();
        const found = data.events?.find((e: EventDetail) => e.id === eventId);
        setEvent(found || null);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-neutral-400">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-xl font-medium mb-2">Event Not Found</div>
          <div className="text-neutral-400 mb-4">Event ID: {resolvedParams?.eventId}</div>
          <Link href="/admin/events" className="text-emerald-400 hover:underline">
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getDecisionColor = (decision: string) => {
    return decision === 'DENY' ? 'text-red-400' : 'text-emerald-400';
  };

  const getDecisionBg = (decision: string) => {
    return decision === 'DENY' ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30';
  };

  // Build timeline from event
  const timeline: { time: string; event: string; detail: string; isDecision?: boolean }[] = [
    { time: event.timestamp, event: 'BADGE_SCAN', detail: `Badge: ${event.badgeUid || event.actor?.id}` },
  ];

  if (event.device) {
    timeline.push({ 
      time: event.timestamp, 
      event: 'DEVICE_POSTURE_CHECK', 
      detail: `Device: ${event.device.id}, Status: ${event.device.complianceStatus}` 
    });
  }

  if (event.riskScore) {
    timeline.push({ 
      time: event.timestamp, 
      event: 'RISK_SCORED', 
      detail: `Score: ${event.riskScore}, Level: ${event.riskLevel || 'N/A'}` 
    });
  }

  if (event.policy) {
    timeline.push({ 
      time: event.timestamp, 
      event: 'POLICY_MATCHED', 
      detail: `Policy: ${event.policy}` 
    });
  }

  timeline.push({ 
    time: event.timestamp, 
    event: `SESSION_${event.decision}`, 
    detail: `Decision: ${event.decision}, Reason: ${event.reason || 'N/A'}`,
    isDecision: true
  });

  for (const action of event.actionsTriggered || []) {
    timeline.push({ 
      time: event.timestamp, 
      event: `${action.toUpperCase().replace(/_/g, '_')}_TRIGGERED`, 
      detail: `Action: ${action.replace(/_/g, ' ')}`
    });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/events" className="text-neutral-400 hover:text-white">
                ← Back
              </Link>
              <h1 className="text-xl font-semibold">Event Detail</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                ● Connected
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className={`border rounded-xl p-6 mb-6 ${getDecisionBg(event.decision)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-400 mb-1">Final Decision</div>
              <div className={`text-3xl font-bold ${getDecisionColor(event.decision)}`}>
                {event.decision}
              </div>
              <div className="text-neutral-400 mt-1">{event.reason}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-400">Event ID</div>
              <div className="font-mono text-sm">{event.id}</div>
              <div className="text-sm text-neutral-400 mt-2">{formatDateTime(event.timestamp)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Event Timeline</h2>
              
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-neutral-800"></div>
                
                <div className="space-y-6">
                  {timeline.map((item, index) => (
                    <div key={index} className="relative flex gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                        item.isDecision 
                          ? (event.decision === 'DENY' ? 'bg-red-500' : 'bg-emerald-500') 
                          : 'bg-neutral-700'
                      }`}>
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className={`font-semibold ${
                          item.isDecision ? (event.decision === 'DENY' ? 'text-red-400' : 'text-emerald-400') : 'text-neutral-200'
                        }`}>
                          {item.event}
                        </div>
                        <div className="text-sm text-neutral-400 mt-0.5">{item.detail}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(item.time).toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Context */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Context</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-neutral-400">User</div>
                  <div className="text-sm">{event.actor?.name || event.actor?.id || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Device</div>
                  <div className="text-sm font-mono">{event.device?.id || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Posture</div>
                  <div className="text-sm">
                    {event.device?.complianceStatus ? (
                      <span className={event.device.complianceStatus === 'compliant' ? 'text-emerald-400' : 'text-red-400'}>
                        {event.device.complianceStatus}
                      </span>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Location</div>
                  <div className="text-sm">{event.location || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Badge UID</div>
                  <div className="text-sm font-mono">{event.badgeUid || '-'}</div>
                </div>
              </div>
            </div>

            {/* Decision */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Decision</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-neutral-400">Matched Policy</div>
                  <div className="text-sm">{event.policy || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Risk Score</div>
                  <div className="text-sm">
                    {event.riskScore ? (
                      <span className={
                        event.riskScore >= 70 ? 'text-red-400' : 
                        event.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
                      }>
                        {event.riskScore} ({event.riskLevel || 'N/A'})
                      </span>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Reason Code</div>
                  <div className="text-sm">{event.reason || '-'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Actions Triggered</h3>
              <div className="space-y-2">
                {event.actionsTriggered?.length ? (
                  event.actionsTriggered.map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-sm">{action.replace(/_/g, ' ')}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-400 text-sm">No actions triggered</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
