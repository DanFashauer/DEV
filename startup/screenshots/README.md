# SignalGrid Screenshot Guide

## Admin Views to Capture

This document lists the exact `/admin` views to capture for slides and website marketing materials.

---

## Dashboard Views

### 1. Executive Summary Dashboard

**URL:** `/admin`

**What to capture:**
- Executive summary cards at top:
  - Total Active Sessions (with trend indicator)
  - Devices Online (with status dot)
  - High-Risk Incidents (highlighted in red/amber)
  - SIEM Events (last 24h)
- Activity feed/table below

**Caption suggestion:** "Executive dashboard showing real-time device security posture"

**Use in:**
- Pitch deck (traction slide)
- Landing page (product screenshot)
- Case studies

---

### 2. Dashboard - Healthcare Scenario

**URL:** `/admin` (with demo scenario: Healthcare)

**What to capture:**
- Same dashboard view
- Show scenario selector with "Healthcare" highlighted
- Metrics specific to healthcare demo

**Caption suggestion:** "Healthcare scenario: Shared iPad authentication with HIPAA compliance"

**Use in:**
- Healthcare vertical one-pager
- Landing page (healthcare section)
- Demo recordings

---

### 3. Dashboard - Retail Scenario

**URL:** `/admin` (with demo scenario: Retail)

**What to capture:**
- Dashboard with retail metrics
- Scenario selector with "Retail" highlighted

**Caption suggestion:** "Retail scenario: Kiosk management with employee/visitor modes"

**Use in:**
- Retail vertical one-pager
- Landing page (retail section)

---

### 4. Dashboard - Logistics Scenario

**URL:** `/admin` (with demo scenario: Logistics)

**What to capture:**
- Dashboard with logistics metrics
- Scenario selector with "Logistics" highlighted

**Caption suggestion:** "Logistics scenario: Warehouse tablets with shift handovers"

**Use in:**
- Logistics vertical one-pager
- Landing page (logistics section)

---

## Policy Management

### 5. Policies List

**URL:** `/admin/policies`

**What to capture:**
- List of policy rules
- Status indicators (enabled/disabled)
- Quick actions (edit, delete, toggle)

**Caption suggestion:** "Policy engine with role-based access control"

**Use in:**
- Pitch deck (product slide)
- Technical documentation

---

### 6. Policy Editor

**URL:** `/admin/policies/[id]` or `/admin/policies` (create new)

**What to capture:**
- Policy form with conditions:
  - User role selector
  - Device posture checks
  - Time/location conditions
- Actions configuration:
  - Launch app
  - Set session TTL
  - Quarantine device

**Caption suggestion:** "Policy builder with context-aware conditions and actions"

**Use in:**
- Pitch deck (product slide)
- Technical documentation
- Admin UI showcase

---

## Device Management

### 7. Devices List

**URL:** `/admin/devices`

**What to capture:**
- Table of enrolled devices
- Columns: Device ID, Status, Last Seen, Risk Level
- Filter/search functionality

**Caption suggestion:** "Device registry with real-time status monitoring"

**Use in:**
- Pitch deck
- Admin UI showcase

---

### 8. Device Detail / Identity

**URL:** `/admin/devices/identity/[deviceId]`

**What to capture:**
- Device detail view
- Identity information
- Posture data (from MDM)
- Session history

**Caption suggestion:** "Device identity with MDM posture integration"

**Use in:**
- Technical documentation
- Admin UI showcase

---

## Badge Management

### 9. Badges List

**URL:** `/admin/badges`

**What to capture:**
- Table of enrolled badges
- Columns: Badge UID, User, Status, Enrolled Date
- Actions: Enroll new, Delete

**Caption suggestion:** "Badge registry for employee authentication"

**Use in:**
- Admin UI showcase
- Setup documentation

---

### 10. Enroll Badge

**URL:** `/admin/badges/enroll`

**What to capture:**
- Enroll form
- Badge UID input
- User assignment dropdown

**Caption suggestion:** "Simple badge enrollment workflow"

**Use in:**
- Admin UI showcase
- Onboarding documentation

---

## Integration Management

### 11. Integrations Overview

**URL:** `/admin/integrations` (if exists) or combined views

**What to capture:**
- Integration cards:
  - MDM: FleetDM, Jamf, Intune
  - ITSM: ServiceNow, Jira, Zendesk
  - SIEM: Splunk, Sentinel
  - NAC: Cisco ISE, Aruba

**Caption suggestion:** "Enterprise integrations: MDM, ITSM, SIEM, and NAC"

**Use in:**
- Pitch deck (integrations slide)
- Landing page (integrations section)
- Technical documentation

---

### 12. MDM Configuration (FleetDM)

**URL:** `/admin/integrations/telemetry/fleetdm`

**What to capture:**
- FleetDM connection form
- API key / credentials input
- Test connection button
- Sync status

**Caption suggestion:** "FleetDM integration for device posture checking"

**Use in:**
- Technical documentation
- Integration setup guides

---

### 13. ITSM Configuration

**URL:** `/admin/integrations/itsm`

**What to capture:**
- List of configured ITSM vendors
- Status (connected, error)
- Actions: Configure, Test, Delete

**Caption suggestion:** "ITSM integration for automatic ticket creation"

**Use in:**
- Pitch deck
- Technical documentation

---

### 14. Webhooks Configuration

**URL:** `/admin/integrations/webhooks`

**What to capture:**
- List of webhook endpoints
- Event types subscribed
- Signing secret management

**Caption suggestion:** "Webhook integration for custom workflows"

**Use in:**
- Technical documentation

---

## Audit & Compliance

### 15. Audit Log

**URL:** `/admin/audit` (if exists) or `/admin/audit/export`

**What to capture:**
- Audit log table
- Columns: Timestamp, Event, User, Device, Details
- Filters: Date range, event type

**Caption suggestion:** "Tamper-evident audit ledger for compliance"

**Use in:**
- Pitch deck (compliance slide)
- Technical documentation
- Security whitepaper

---

### 16. Audit Verify

**URL:** `/admin/audit/verify`

**What to capture:**
- Chain integrity status
- Hash verification result
- Last verified timestamp

**Caption suggestion:** "Audit chain integrity verification"

**Use in:**
- Security whitepaper
- Compliance documentation

---

## Location (if applicable)

### 17. Location Dashboard

**URL:** `/admin/location`

**What to capture:**
- Location signals table
- Device positions
- Location mode settings

**Caption suggestion:** "Location-aware policy enforcement"

**Use in:**
- Technical documentation

---

## Auth & Security

### 18. WebAuthn Registration

**URL:** `/admin/webauthn/register`

**What to capture:**
- Registration flow UI
- Security key options

**Caption suggestion:** "Step-up authentication with WebAuthn/FIDO2"

**Use in:**
- Security documentation
- Pitch deck (security slide)

---

## Screenshot Best Practices

### Resolution
- Capture at 1920x1080 minimum
- Use retina/2x for crisp display

### Browser
- Use Chrome or Safari
- Disable extensions for clean capture

### Context
- Show realistic data (use demo:seed)
- Include header/navigation for context

### Annotations (if needed)
- Use consistent color: SignalGrid Blue (#3B82F6)
- Keep text minimal
- Arrow/challenge annotations for feature highlights

### Dark/Light Mode
- Capture both if design supports
- Default to light for slides/presentations

---

## Naming Convention

```
startup/screenshots/
├── dashboard/
│   ├── dashboard-overview.png
│   ├── dashboard-healthcare.png
│   ├── dashboard-retail.png
│   └── dashboard-logistics.png
├── policies/
│   ├── policies-list.png
│   └── policy-editor.png
├── devices/
│   ├── devices-list.png
│   └── device-detail.png
├── badges/
│   ├── badges-list.png
│   └── badge-enroll.png
├── integrations/
│   ├── integrations-overview.png
│   ├── fleetdm-config.png
│   ├── itsm-config.png
│   └── webhooks-config.png
├── audit/
│   ├── audit-log.png
│   └── audit-verify.png
└── auth/
    └── webauthn-register.png
```

---

## Slide Placement Guide

### Pitch Deck
| Slide | Recommended Screenshot |
|-------|----------------------|
| Product | Policy editor |
| Integrations | Integrations overview |
| Demo | Dashboard (Healthcare) |
| Security | Audit log |
| Dashboard | Executive summary |

### Landing Page
| Section | Recommended Screenshot |
|---------|----------------------|
| Hero | Dashboard overview |
| Healthcare | Dashboard (Healthcare) |
| Retail | Dashboard (Retail) |
| Logistics | Dashboard (Logistics) |
| Features | Policy editor |
| Integrations | Integrations overview |
| Security | Audit verify |

### Technical Docs
| Page | Recommended Screenshot |
|------|----------------------|
| Getting started | Badges list |
| Policies | Policy editor |
| Devices | Devices list |
| Integrations | FleetDM config |
| Audit | Audit log |
