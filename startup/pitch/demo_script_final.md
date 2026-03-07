# SignalGrid Demo Script

## 5-Minute Version (CIO/Investor) & 15-Minute Technical Version

---

## Pre-Demo Setup

### Launch the Demo

```bash
# Terminal 1: Seed demo data
bun run demo:seed

# Terminal 2: Start dev server
bun run dev
```

### Open Browser
Navigate to: http://localhost:3000/admin

### Demo User Context
- Admin credentials: (use demo seed credentials)
- Scenario selector: Healthcare / Retail / Logistics

---

## 5-Minute Demo (CIO/Investor)

*Time: 5 minutes | Audience: C-Suite, Investors*

### Opening (30 seconds)

> "Hi, I'm [Name], founder of SignalGrid. We secure shared enterprise devices—iPads, tablets, kiosks—and automate access control. Let me show you how it works in a real healthcare scenario."

### The Problem (30 seconds)

> "Here's the challenge: Your hospital has 12 shared iPads for nurse check-ins. Currently, anyone can pick one up and access patient data. It's a HIPAA violation waiting to happen. Average healthcare breach costs $10M+."

### Demo - Healthcare Scenario (2 minutes)

**Step 1: Show the Dashboard**

- Navigate to `/admin`
- Point out: Active sessions, devices online, risk incidents

> "This is our admin dashboard. Real-time visibility into every device."

**Step 2: Switch to Healthcare**

- Select "Healthcare" from scenario dropdown
- Highlight: Nurse-specific metrics

> "We've pre-configured a healthcare scenario. See how it shows relevant metrics?"

**Step 3: Show Badge Enrollment**

- Navigate to `/admin/badges/enroll`
- Show: Simple workflow

> "Enrolling a badge takes seconds. Badge UID, assign user, done."

**Step 4: Show Policy Editor**

- Navigate to `/admin/policies`
- Click on a policy or create new
- Highlight: Conditions and actions

> "Our policy engine lets you define who can access what, when. This policy says: nurses get 15-minute sessions with the Patient Check-In app. If the device fails posture check—quarantine."

### The Solution Summary (1 minute)

> "That's SignalGrid. Four steps: Tap badge, authenticate in <2 seconds, work with the right apps, auto-lock when you walk away. Full audit trail for HIPAA compliance."

### Integration Slide (30 seconds)

> "We integrate with your existing tools—FleetDM for device posture, ServiceNow for ticketing, Splunk for SIEM. No rip-and-replace."

### Closing (30 seconds)

> "We're launching pilots now at $2,500 for 50 devices. Enterprise is $2,000/month unlimited. Let's schedule a deeper technical demo—I'd love to understand your specific use case."

**Total: 5 minutes**

---

## 15-Minute Demo (Technical)

*Time: 15 minutes | Audience: IT, Security, Operations*

### Opening (1 minute)

> "Thanks for joining. Today I'll walk you through SignalGrid end-to-end: the admin experience, badge authentication flow, policy engine, and integrations. We'll do a live demo in healthcare, then I can show retail or logistics if relevant."

---

### Part 1: Admin Dashboard (3 minutes)

**Navigate to:** `/admin`

> "Let's start with the command center."

**Walk through:**
1. **Summary Cards:** Active sessions, devices online, risk incidents, SIEM events
2. **Activity Feed:** Real-time events, filters
3. **Scenario Selector:** Healthcare, Retail, Logistics

> "This shows everything at a glance. The scenario selector changes context—we'll see healthcare now, but we can switch to retail or logistics. Each has pre-configured policies and metrics."

**Action:** Switch to Healthcare, show different metrics

> "Healthcare shows HIPAA-relevant metrics. Retail would show kiosk-specific data."

---

### Part 2: Device Management (3 minutes)

**Navigate to:** `/admin/devices`

> "Every device that connects to SignalGrid is registered here."

**Walk through:**
1. **Device List:** ID, status, last seen, risk level
2. **Device Detail:** Click on a device

> "Each device has full identity—serial number, MDM enrollment status, posture data from FleetDM. This is what gets evaluated during authentication."

**Action:** Click on a device, show detail view

> "Here's a device that's compliant—this one failed posture check, so it's flagged."

---

### Part 3: Badge Management (2 minutes)

**Navigate to:** `/admin/badges`

> "Badges map to users. This is the credential side of the equation."

**Walk through:**
1. **Badge List:** UID, user, status, enrolled date
2. **Enroll New Badge:** `/admin/badges/enroll`

**Action:** Show enroll form

> "Enrolling takes under a minute. Badge UID, assign a user, done. We support BLE, NFC, and USB-C readers."

---

### Part 4: Policy Engine (4 minutes)

**Navigate to:** `/admin/policies`

> "This is where the magic happens. Policies define what happens on authentication."

**Walk through:**
1. **Policy List:** Name, status, conditions count, actions
2. **Policy Editor:** Click on existing policy or create new

> "Let me show you a policy. This one is for nurses."

**Action:** Show a policy with:
- **Conditions:** User role = nurse, Device posture = compliant, Time = any
- **Actions:** Launch "Patient Check-In" app, Session TTL = 15 minutes, Log to SIEM

> "Conditions are ANDed together. All must pass. Actions execute in order. This says: if the user is a nurse AND the device passes posture check, launch the Patient Check-In app for 15 minutes and log everything to Splunk."

**Show Policy Actions:**
> "We can launch apps, set session length, quarantine devices, create ITSM tickets. These are the automation hooks."

**Action:** Show the create policy form

> "Building a policy is point-and-click. No code required."

---

### Part 5: Integrations (3 minutes)

> "SignalGrid doesn't work in isolation. Here's how we fit with your stack."

**Navigate to:** `/admin/integrations/telemetry/fleetdm`

> "FleetDM integration for device posture. We pull encryption status, OS version, MDM enrollment."

**Action:** Show FleetDM config

> "API key, instance URL, test connection. Simple setup, real-time posture."

**Navigate to:** `/admin/integrations/itsm`

> "ITSM integrations—ServiceNow, Jira, Zendesk, generic webhooks. When a policy triggers, we auto-create tickets."

**Navigate to:** `/admin/integrations/webhooks`

> "Webhooks let you send events anywhere. We sign payloads with HMAC—you can verify integrity."

**Navigate to:** `/admin/integrations/nac`

> "Network access control—Cisco ISE, Aruba ClearPass. Quarantine a device, we push the command."

---

### Part 6: Audit & Compliance (2 minutes)

**Navigate to:** `/admin/audit/export`

> "Compliance is baked in. Every action is logged to our tamper-evident ledger."

**Walk through:**
1. **Audit Log:** Timestamp, event, user, device, details
2. **Chain integrity:** Show hash verification

> "Each entry includes the previous hash. Tamper with one, the chain breaks. Auditors love this."

**Action:** Navigate to `/admin/audit/verify`

> "One-click chain verification. Green means valid."

---

### Part 7: Q&A (1 minute)

> "That's the platform. Happy to go deeper on any area—badge readers, specific integrations, deployment options. What would you like to explore?"

---

## Demo Flow (Live Simulation)

If you can't do a live badge tap, simulate the flow:

```bash
# Terminal: Run badge simulation
bun run sim:badge --user "nurse-001" --scenario healthcare
```

This will:
1. Create a badge event
2. Trigger authentication
3. Evaluate policies
4. Create a session
5. Log to audit ledger

You can show the resulting session in the dashboard.

---

## Quick Reference: Key URLs

| View | URL |
|------|-----|
| Dashboard | `/admin` |
| Devices | `/admin/devices` |
| Badges | `/admin/badges` |
| Policies | `/admin/policies` |
| FleetDM | `/admin/integrations/telemetry/fleetdm` |
| ITSM | `/admin/integrations/itsm` |
| Webhooks | `/admin/integrations/webhooks` |
| Audit Log | `/admin/audit/export` |
| Audit Verify | `/admin/audit/verify` |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No data showing | Run `bun run demo:seed` |
| Server not responding | Check port 3000, restart with `bun run dev` |
| Auth issues | Check demo seed output for credentials |
| Slow UI | Clear browser cache, use Chrome |

---

*End of Demo Script*
