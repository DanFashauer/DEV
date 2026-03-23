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
}

// Timeline entry with explicit order
type TimelineEntry = {
  order: number;
  time: string;
  event: string;
  detail: string;
  isDecision?: boolean;
};

// Ordered timeline: 1=badge, 2=posture, 3=policy, 4=decision, 5+=actions
const TIMELINE_ORDER: Record<string, number> = {
  'BADGE_SCAN': 1,
  'DEVICE_POSTURE_CHECK': 2,
  'POSTURE_CHECK': 2,
  'RISK_SCORED': 3,
  'POLICY_MATCHED': 4,
  'SESSION_DENY': 5,
  'SESSION_DENIED': 5,
  'SESSION_ALLOW': 5,
  'SESSION_ALLOWED': 5,
};

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ eventId: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    const eventId = resolvedParams?.eventId;
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
  }, [resolvedParams]);

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

  const getBannerBg = (decision: string) => {
    return decision === 'DENY' 
      ? 'from-red-600 to-red-800' 
      : 'from-emerald-600 to-emerald-800';
  };

  // Build ORDERED timeline - strict ordering with human-readable labels
  const timeline: TimelineEntry[] = [];
  
  // 1. Badge Scan
  timeline.push({
    order: 1,
    time: event.timestamp,
    event: 'Badge Tapped',
    detail: `${event.actor?.name || event.actor?.id || 'User'} presented their badge`
  });

  // 2. Posture Check
  if (event.device) {
    const isCompliant = event.device.complianceStatus === 'compliant';
    timeline.push({
      order: 2,
      time: event.timestamp,
      event: 'Device Security Check',
      detail: `Checking device security status: ${isCompliant ? 'Pass' : 'Failed'} — Device: ${event.device.id}`
    });
  }

  // 3. Risk Score
  if (event.riskScore) {
    timeline.push({
      order: 3,
      time: event.timestamp,
      event: 'Risk Assessment',
      detail: `Security risk score: ${event.riskScore}/100 (${event.riskLevel || 'N/A'})`
    });
  }

  // 4. Policy Match
  if (event.policy) {
    timeline.push({
      order: 4,
      time: event.timestamp,
      event: 'Security Policy',
      detail: `Applied: ${event.policy}`
    });
  }

  // 5. Decision
  timeline.push({
    order: 5,
    time: event.timestamp,
    event: event.decision === 'DENY' ? 'Access Denied' : 'Access Granted',
    detail: event.decision === 'DENY' 
      ? `Security policy blocked access — ${event.reason || 'Device non-compliant'}`
      : `Access approved — User authenticated successfully`,
    isDecision: true
  });

  // 6+. Actions (in order triggered)
  const actionOrder = ['quarantine_device', 'emit_siem_event', 'send_itsm_ticket', 'notify_admin'];
  const sortedActions = [...(event.actionsTriggered || [])].sort((a, b) => {
    const ai = actionOrder.indexOf(a);
    const bi = actionOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  
  let actionIndex = 6;
  for (const action of sortedActions) {
    timeline.push({
      order: actionIndex++,
      time: event.timestamp,
      event: getHumanReadableAction(action),
      detail: getActionDescription(action)
    });
  }

  // Sort by order number (strict)
  timeline.sort((a, b) => a.order - b.order);

  // Explain decision in C-suite friendly terms
  const getDecisionExplanation = () => {
    if (event.decision !== 'DENY') {
      return {
        title: 'Access Granted',
        items: [
          { label: 'Device Status', value: event.device?.complianceStatus || 'Compliant' },
          { label: 'Risk Level', value: event.riskLevel || 'Low' },
        ]
      };
    }

    // DENY explanation
    const reasons: string[] = [];
    if (event.device?.complianceStatus === 'non_compliant') {
      reasons.push('Device does not meet security requirements');
    }
    if (event.riskScore && event.riskScore >= 70) {
      reasons.push('Risk score above acceptable threshold');
    }
    if (event.policy) {
      reasons.push(`Policy triggered: ${event.policy}`);
    }

    return {
      title: 'Access Denied',
      items: [
        { label: 'Device Status', value: event.device?.complianceStatus || 'Non-Compliant' },
        { label: 'Risk Score', value: `${event.riskScore || 'N/A'} (${event.riskLevel || 'High'})` },
        { label: 'Primary Reason', value: reasons[0] || 'Security policy violation' },
        { label: 'Policy Applied', value: event.policy || 'High-Risk Device Block' },
      ]
    };
  };

  const explanation = getDecisionExplanation();
  const aiExplanation = generateAIExplanation(event);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ========== DECISION BANNER (CRITICAL) ========== */}
        <div className={`bg-gradient-to-r ${getBannerBg(event.decision)} rounded-xl p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                {event.decision === 'DENY' ? '🚫 Access Denied' : '✅ Access Granted'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">{formatDateTime(event.timestamp)}</div>
              <div className="font-mono text-sm">{event.id}</div>
            </div>
          </div>
          
          {/* Actions Triggered */}
          {event.actionsTriggered && event.actionsTriggered.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="text-sm font-semibold mb-2">Automated Security Actions:</div>
              <div className="flex flex-wrap gap-2">
                {event.actionsTriggered.map((action, i) => (
                  <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {getActionIcon(action)} {getHumanReadableAction(action)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary (compact) */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white/60">🧠 AI:</span>
              <span className="text-sm text-white/80">{aiExplanation.explanation}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ========== TIMELINE ========== */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Event Timeline</h2>
              
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-neutral-700"></div>
                
                <div className="space-y-6">
                  {timeline.map((item, index) => (
                    <div key={index} className="relative flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${
                        item.isDecision 
                          ? (event.decision === 'DENY' ? 'bg-red-500' : 'bg-emerald-500') 
                          : 'bg-neutral-700'
                      }`}>
                        <span className="text-xs font-bold">{item.order}</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className={`font-semibold text-base ${
                          item.isDecision ? (event.decision === 'DENY' ? 'text-red-400' : 'text-emerald-400') : 'text-neutral-200'
                        }`}>
                          {item.event}
                        </div>
                        <div className="text-sm text-neutral-400 mt-1">{item.detail}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(item.time).toLocaleTimeString('en-US', { hour12: false })}
            </div>

            {/* AI Reasoning Layer */}
            <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🧠</span>
                <h3 className="text-lg font-semibold">AI Reasoning</h3>
                <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded">Preview</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-violet-400 uppercase tracking-wide mb-1">Explanation</div>
                  <div className="text-sm text-neutral-200">{aiExplanation.explanation}</div>
                </div>
                <div>
                  <div className="text-xs text-violet-400 uppercase tracking-wide mb-1">Recommendation</div>
                  <div className="text-sm text-neutral-200">{aiExplanation.recommendation}</div>
                </div>
              </div>
            </div>
          </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========== EXPLAIN DECISION PANEL ========== */}
          <div className="space-y-6">
            
            {/* Why Decision Was Made */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                {event.decision === 'DENY' ? '🚫 Why Access Was Denied' : '✅ Why Access Was Granted'}
              </h3>
              <div className="space-y-4">
                {explanation.items.map((item, i) => (
                  <div key={i} className="border-b border-neutral-800 pb-3 last:border-0">
                    <div className="text-xs text-neutral-400 uppercase tracking-wide">{item.label}</div>
                    <div className={`text-sm font-medium mt-1 ${
                      item.label.includes('Status') && event.decision === 'DENY' ? 'text-red-400' : 'text-neutral-200'
                    }`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Context Panel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Event Context</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-neutral-400">User</div>
                  <div className="text-sm">{event.actor?.name || event.actor?.id || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Device ID</div>
                  <div className="text-sm font-mono">{event.device?.id || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Badge UID</div>
                  <div className="text-sm font-mono">{event.badgeUid || event.actor?.id || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Location</div>
                  <div className="text-sm">{event.location || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Event ID</div>
                  <div className="text-xs font-mono text-neutral-500">{event.id}</div>
                </div>
              </div>
            </div>

            {/* All Actions */}
            {event.actionsTriggered && event.actionsTriggered.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Security Actions Executed</h3>
                <div className="space-y-2">
                  {event.actionsTriggered.map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-sm">{getActionLabel(action)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function getActionIcon(action: string): string {
  switch (action) {
    case 'quarantine_device': return '🔒';
    case 'emit_siem_event': return '📡';
    case 'send_itsm_ticket': return '🎫';
    case 'notify_admin': return '👤';
    default: return '⚡';
  }
}

function getHumanReadableAction(action: string): string {
  switch (action) {
    case 'quarantine_device': return 'Device Quarantined';
    case 'emit_siem_event': return 'SIEM Alert Sent';
    case 'send_itsm_ticket': return 'ITSM Ticket Created';
    case 'notify_admin': return 'Admin Notified';
    default: return action.replace(/_/g, ' ');
  }
}

// AI Reasoning Layer - generates explanations for decisions
function generateAIExplanation(event: EventDetail): { explanation: string; recommendation: string } {
  const { decision, device, riskScore, riskLevel, policy, actionsTriggered } = event;
  
  if (decision === 'DENY') {
    const reasons: string[] = [];
    let recommendation = '';
    
    if (device?.complianceStatus === 'non_compliant') {
      reasons.push('Device does not meet security requirements (non-compliant)');
    }
    if (riskScore && riskScore >= 70) {
      reasons.push(`Risk score (${riskScore}) exceeded acceptable threshold`);
    }
    if (policy) {
      reasons.push(`Security policy "${policy}" was triggered`);
    }
    
    const explanation = reasons.length > 0 
      ? reasons.join('. ') 
      : 'Access denied due to security policy violation';
    
    if (actionsTriggered?.includes('quarantine_device')) {
      recommendation = 'Device has been quarantined. Notify IT team to investigate.';
    } else if (actionsTriggered?.includes('send_itsm_ticket')) {
      recommendation = 'Incident ticket created. User must resolve compliance issue before retry.';
    } else {
      recommendation = 'User should contact IT support for resolution.';
    }
    
    return { explanation, recommendation };
  }
  
  // ALLOW decision
  const explanations: string[] = [];
  let recommendation = '';
  
  if (device?.complianceStatus === 'compliant') {
    explanations.push('Device meets all security requirements');
  }
  if (riskScore && riskScore < 40) {
    explanations.push(`Risk score (${riskScore}) is within acceptable range`);
  }
  explanations.push('All security policies passed');
  
  const explanation = explanations.join('. ');
  recommendation = 'Session created successfully. Standard access granted.';
  
  return { explanation, recommendation };
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'quarantine_device': return 'Quarantine Device';
    case 'emit_siem_event': return 'SIEM Alert';
    case 'send_itsm_ticket': return 'Create ITSM Ticket';
    case 'notify_admin': return 'Notify Admin';
    default: return action.replace(/_/g, ' ');
  }
}

function getActionDescription(action: string): string {
  switch (action) {
    case 'quarantine_device': return 'Device network access restricted';
    case 'emit_siem_event': return 'Security event sent to SIEM';
    case 'send_itsm_ticket': return 'Incident ticket created in ITSM';
    case 'notify_admin': return 'Security team notified';
    default: return action.replace(/_/g, ' ');
  }
}
