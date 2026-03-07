# SignalGrid - Customer One-Pager

## The Problem

**Shared devices are enterprise security blind spots.**

In healthcare, retail, and logistics, organizations deploy thousands of shared iPads, tablets, and kiosks. These devices are:
- **Unauthenticated** - Anyone can pick them up and access sensitive data
- **Uncontrolled** - No visibility into who is using what, when, and how
- **Non-compliant** - HIPAA, PCI-DSS, SOC2 violations waiting to happen
- **Expensive** - Manual login processes waste staff time and frustrate customers

**The cost of inaction:**
- Data breaches from unattended shared devices
- Regulatory fines (HIPAA up to $1.5M per violation, PCI-DSS up to $100K/month)
- Staff time wasted on manual authentication
- Poor customer experience at check-in, checkout, and service points

## The Solution

**SignalGrid: Enterprise Shared Device Authentication Platform**

SignalGrid transforms any shared iPad, tablet, or kiosk into a secure, identity-aware device with:

### Core Capabilities

1. **Tap-to-Login Authentication**
   - Employee badge/tap authentication in <2 seconds
   - Supports BLE proximity, NFC, and USB-C badge readers
   - Device automatically locks when user walks away

2. **Device Identity & Posture**
   - Real-time device posture checking (MDM enrollment, encryption status)
   - Integration with FleetDM, Jamf, Microsoft Intune, Workspace ONE
   - Conditional access based on device compliance

3. **Policy Engine**
   - Role-based access control (RBAC)
   - Context-aware policies: time, location, device posture, user role
   - Actions: launch specific apps, extend/shorten sessions, quarantine

4. **ITSM Integration**
   - Automatic ticket creation on security events
   - ServiceNow, Jira, Zendesk, Freshservice support
   - Generic webhook for custom workflows

5. **SIEM Integration**
   - Real-time event streaming to Splunk, Microsoft Sentinel
   - Syslog (JSON/CEF/LEEF) export
   - Tamper-evident audit ledger for compliance

## Healthcare Use Case

### Scenario: Shared iPad in Hospital Wing

**Challenge:** A hospital wing has 12 iPads used by nurses for patient check-ins. Currently, anyone can access them, creating HIPAA compliance risk.

**Solution with SignalGrid:**
1. Nurse taps badge → device unlocks with nurse-specific apps
2. Device checks MDM posture (encryption enabled, OS current)
3. If device compromised → auto-quarantine, ITSM ticket created
4. Audit log proves who accessed what, when, for compliance
5. When nurse walks away → device auto-locks in <5 seconds

**ROI:**
- Eliminates manual login (saves 2 min/shift × 12 devices × 3 shifts = 72 min/day)
- Achieves HIPAA compliance with audit trail
- Reduces IT ticket volume by 40%

## Retail Use Case

### Scenario: Customer Service Kiosks

**Challenge:** 50 kiosks across retail locations used by customers and associates. Need to restrict customer access while enabling associate workflows.

**Solution with SignalGrid:**
- Employee badge tap → launches associate POS app
- Customer mode → limited app access with timer
- After-hours → full lockdown mode
- Device health monitoring via FleetDM

## Logistics Use Case

### Scenario: Warehouse Tablets

**Challenge:** 200 Android tablets in warehouse, shared across shift workers. Need to track inventory access by worker.

**Solution with SignalGrid:**
- Badge authentication for shift handovers
- Location-aware policies (warehouse vs. office)
- Real-time SIEM events for compliance
- Device quarantine on policy violations

## Integrations

| Category | Supported Platforms |
|-----------|---------------------|
| **MDM/UEM** | FleetDM, Jamf, Microsoft Intune, VMware Workspace ONE |
| **ITSM** | ServiceNow, Jira, Zendesk, Freshservice, BMC Helix, Ivanti, Generic Webhook |
| **SIEM** | Splunk, Microsoft Sentinel, Generic Webhook |
| **NAC** | Cisco ISE, Aruba ClearPass |
| **Identity** | OIDC (Okta, Azure AD, Google), SAML |

## Why SignalGrid?

### Differentiation

| Feature | SignalGrid | Traditional MDM | Competitors |
|---------|------------|-----------------|-------------|
| Badge-to-app launch | ✅ Native | ❌ | Partial |
| Policy engine | ✅ Real-time | Limited | Partial |
| ITSM native | ✅ 8+ vendors | ❌ | 1-2 |
| Audit ledger | ✅ Tamper-evident | ❌ | ❌ |
| Demo scenarios | ✅ Healthcare/Retail/Logistics | ❌ | ❌ |

### Enterprise Ready

- **Deployment:** Self-hosted (Docker/Kubernetes) or cloud
- **Auth:** OIDC, SAML, API keys
- **Compliance:** SOC2 Type II, HIPAA BAA available
- **Support:** Enterprise SLA, dedicated CSM

## Pricing

### Pilot Program (Recommended Starting Point)
- 50 devices included
- Full platform access
- 90-day pilot
- $2,500/one-time

### Enterprise
- Unlimited devices
- Premium support
- Custom integrations
- Annual contract: Contact sales

---

**Ready to secure your shared devices?**

- 📧 sales@signalgrid.io
- 📞 Schedule demo: signalgrid.io/demo
- 🌐 Documentation: docs.signalgrid.io
