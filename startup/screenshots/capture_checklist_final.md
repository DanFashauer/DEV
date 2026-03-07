# Screenshot Capture Checklist

## Priority: Top 8 Screenshots Only

*For pitch deck, website, and one-pager*

---

## Before You Capture

1. Run demo seed:
   ```bash
   bun run demo:seed
   ```

2. Start the dev server:
   ```bash
   bun run dev
   ```

3. Open Chrome at http://localhost:3000

4. Capture at **1920x1080** minimum, retina/2x preferred

---

## Priority Screenshots

### 1. Dashboard Overview ⭐ PRIMARY

**URL:** `/admin`

**What to capture:**
- Executive summary cards: Active Sessions, Devices Online, Risk Incidents, SIEM Events
- Activity feed table below
- Clean header with admin navigation visible

**Use in:** Pitch deck (traction), Website (hero), One-pager

**Caption:** "Executive dashboard showing real-time device security posture"

---

### 2. Dashboard - Healthcare Scenario ⭐ PRIMARY

**URL:** `/admin` (select "Healthcare" from scenario dropdown)

**What to capture:**
- Same dashboard view
- Scenario selector showing "Healthcare"
- Healthcare-specific metrics

**Use in:** Pitch deck (demo), Website (healthcare section)

**Caption:** "Healthcare scenario: Shared iPad authentication with HIPAA compliance"

---

### 3. Dashboard - Retail Scenario ⭐ PRIMARY

**URL:** `/admin` (select "Retail" from scenario dropdown)

**What to capture:**
- Same dashboard view
- Scenario selector showing "Retail"

**Use in:** Website (retail section), One-pager

**Caption:** "Retail scenario: Kiosk management with employee/visitor modes"

---

### 4. Policy Editor ⭐ PRIMARY

**URL:** `/admin/policies` → Click "Create New" or click existing policy

**What to capture:**
- Policy form with conditions:
  - User role selector
  - Device posture checks
  - Time/location conditions
- Actions configuration:
  - Launch app
  - Set session TTL
  - Quarantine device

**Use in:** Pitch deck (product), Website (features)

**Caption:** "Policy builder with context-aware conditions and actions"

---

### 5. Integrations Overview ⭐ PRIMARY

**URL:** `/admin/integrations/*` (combined or individual pages)

**What to capture:**
- Integration cards showing:
  - MDM: FleetDM, Jamf, Intune (connected status)
  - ITSM: ServiceNow, Jira, Zendesk
  - SIEM: Splunk, Sentinel

**Use in:** Pitch deck (integrations), Website (integrations)

**Caption:** "Enterprise integrations: MDM, ITSM, SIEM, and NAC"

---

### 6. Devices List ⭐ PRIMARY

**URL:** `/admin/devices`

**What to capture:**
- Table of enrolled devices
- Columns: Device ID, Status, Last Seen, Risk Level
- At least 3-5 devices with varied status

**Use in:** Pitch deck (product), Technical docs

**Caption:** "Device registry with real-time status monitoring"

---

### 7. Audit Log ⭐ PRIMARY

**URL:** `/admin/audit/export`

**What to capture:**
- Audit log table
- Columns: Timestamp, Event, User, Device, Details
- Various event types visible

**Use in:** Pitch deck (compliance), Website (security)

**Caption:** "Tamper-evident audit ledger for compliance"

---

### 8. Badge Enrollment ⭐ PRIMARY

**URL:** `/admin/badges/enroll`

**What to capture:**
- Enroll form
- Badge UID input field
- User assignment dropdown
- Enroll button

**Use in:** One-pager, Technical docs (onboarding)

**Caption:** "Simple badge enrollment workflow"

---

## Optional Screenshots (If Time Permits)

| # | Screenshot | URL | Use |
|---|------------|-----|-----|
| 9 | Device Detail | `/admin/devices/identity/[id]` | Tech docs |
| 10 | Badges List | `/admin/badges` | Admin UI |
| 11 | FleetDM Config | `/admin/integrations/telemetry/fleetdm` | Tech docs |
| 12 | ITSM Config | `/admin/integrations/itsm` | Tech docs |
| 13 | Location Dashboard | `/admin/location` | Tech docs |
| 14 | WebAuthn | `/admin/webauthn/register` | Security docs |

---

## Capture Tips

### Resolution
- Minimum: 1920x1080
- Preferred: 2560×1440 or retina/2x

### Browser
- Use Chrome or Safari
- Disable extensions for clean capture

### Context
- Include header/navigation for brand context
- Show realistic data (from demo:seed)

### Annotations (if needed)
- Use SignalGrid Blue (#3B82F6)
- Keep text minimal
- Arrow/challenge for feature highlights

### Dark/Light
- Default to light mode for presentations
- Consider dark for security-focused slides

---

## File Naming

```
startup/screenshots/
├── dashboard-overview.png          # Screenshot 1
├── dashboard-healthcare.png         # Screenshot 2
├── dashboard-retail.png             # Screenshot 3
├── policy-editor.png                # Screenshot 4
├── integrations-overview.png        # Screenshot 5
├── devices-list.png                 # Screenshot 6
├── audit-log.png                    # Screenshot 7
└── badge-enroll.png                 # Screenshot 8
```

---

## Slide Placement Reference

| Deliverable | Required Screenshots |
|-------------|---------------------|
| **Pitch Deck** | 1, 2, 4, 5, 7 |
| **Website Homepage** | 1, 2, 3, 4, 5 |
| **Customer One-Pager** | 1, 2, 4, 6 |
| **Technical Docs** | 4, 6, 7, 8 |

---

*Capture these 8 screenshots first. Optional screenshots only if time permits.*
