# SignalGrid Demo Script

## Purpose
This is the canonical demo talk track for SignalGrid.
Use this to ensure consistency across all demo surfaces.

---

## 3-Minute Demo Script

### Opening (20 seconds)

> "Shared devices today don't have real identity or enforcement. Access is assumed, not verified."

---

### Show Mobile Ready Screen (30 seconds)

> "This is a shared device ready for use. The user taps their badge."

(Click: Simulate Badge Tap)

---

### Processing Animation (20 seconds)

> "SignalGrid verifies identity, checks device security, and applies policy before the session starts."

---

### Deny Path (40 seconds)

> "In this case, access is denied because the device is not compliant."
>
> "SignalGrid automatically quarantines the device, sends a SIEM alert, and creates an IT ticket."

---

### Switch to Admin Portal (40 seconds)

> "This is the same event in the admin portal."
>
> "You can see the decision, timeline, and all downstream actions."

---

### Glance Layer (30 seconds)

> "And this is the Glance Layer—every device shows who has it, where it belongs, and when it's due back."

---

### Close (20 seconds)

> "SignalGrid makes access decisions before sessions start, enforces security automatically, and makes shared devices self-explanatory."

---

## Demo Flow Sequence

1. Start in iOS Prototype - Ready Screen
2. Tap "Simulate Badge Tap"
3. Watch Processing animation
4. Show Access Denied screen
5. Explain automated actions
6. Switch to Admin Portal - Dashboard
7. Click on Security Event
8. Show Decision Banner
9. Show Timeline
10. Show Integration Logs
11. Return to Mobile - Glance Layer
12. Toggle between verticals (Healthcare/Warehouse/Retail)
13. Toggle between states (OK/Due Soon/Overdue)

---

## Key Talking Points

### Value Proposition
- SignalGrid decides access BEFORE a session starts
- Not reactive - preventive
- Cross-system orchestration (NAC + SIEM + ITSM)

### Glance Layer Differentiator
- Makes devices self-explanatory
- Staff know who has it, where it belongs, when it's due back
- Reduces "where is my device?" IT tickets

### Healthcare Example
- Doctor taps badge on shared iPad
- Device checked for compliance (jailbroken, MDM, encryption)
- If non-compliant: access denied, device quarantined, ticket created

---

## Objection Responses

### "Is this replacing MDM?"
> "No. SignalGrid sits above MDM. We check device posture from MDM but we don't manage devices."

### "Is this replacing IAM?"
> "No. We're focused on shared devices and physical access, not enterprise identity systems."

### "Is this just for healthcare?"
> "No. We see strong fit in healthcare, warehouse, retail - anywhere there are shared mobile devices."

### "Why not just use Imprivata?"
> "Imprivata is strong for SSO. We're focused on the pre-session decision layer and visible device state that they don't address."

---

## Technical Details (For Deep Dives)

### What We Check
- Device compliance (MDM status, jailbreak detection)
- User identity (badge → directory)
- Risk score (behavioral signals)
- Policy rules (role, location, time)

### What We Trigger
- NAC commands (quarantine, reauthenticate)
- SIEM events ( Splunk, Sentinel, QRadar)
- ITSM tickets (ServiceNow, Jira, Zendesk)

### Deployment
- API-first decision engine
- Integrates with existing MDM, IdP, NAC
- Admin portal for visibility
- No rip-and-replace

---

## Screens to Reference

| Screen | File | Key Elements |
|--------|------|--------------|
| iOS Ready | ios/Prototype/ReadyScreen.swift | Tenant branding, tap to begin |
| iOS Processing | ios/Prototype/ProcessingScreen.swift | 4-step animated progress |
| iOS Access Denied | ios/Prototype/AccessDeniedScreen.swift | Red banner, reasons, actions |
| iOS Glance Layer | ios/Prototype/GlanceLayerScreen.swift | Device card, state toggles |
| Admin Dashboard | src/app/admin/page.tsx | Events, logs, Glance preview |
| Event Detail | src/app/admin/events/[eventId]/page.tsx | Decision banner, timeline, AI |

---

## Version History

| Date | Changes |
|------|---------|
| 2026-03-19 | Initial script created |
