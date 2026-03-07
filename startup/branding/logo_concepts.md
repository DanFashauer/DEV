# SignalGrid Logo Concepts

## Enterprise Security Tone

**Design Principles:**
- Trustworthy, professional, enterprise-ready
- Simple, memorable, scalable
- Works at 16x16 favicon and 512x512 hero
- Works in light and dark mode
- Avoid: cutesy, childish, overly complex

---

## Concept 1: Grid Signal

### Description
A stylized grid pattern with signal waves emanating from a central point. Represents both "grid" (network/device ecosystem) and "signal" (authentication/proximity).

### Visual Elements

```
   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║     Concept: Grid Signal              ║
   ║                                       ║
   ║          ╭─────╮                      ║
   ║         ╱       ╲                     ║
   ║        │    ●    │    ← Central dot  ║
   ║         ╲       ╱                     ║
   ║          ╰─────╯                      ║
   ║            │ │                        ║
   ║          ╭─╯ ╰─╮                      ║
   ║         ╱       ╲                     ║
   ║        │  ━━━━   │   ← Signal waves  ║
   ║         ╲       ╱                     ║
   ║          ╰─────╯                      ║
   ║                                       ║
   ║     SIGNALGRID                        ║
   ║                                       ║
   ╚═══════════════════════════════════════╝
```

### Colors
- Primary: `#0F172A` (Slate 900 - deep navy)
- Accent: `#3B82F6` (Blue 500 - trust blue)
- Signal wave: `#22D3EE` (Cyan 400 - tech accent)

### Typography
- Wordmark: Inter or SF Pro (clean, modern sans-serif)
- Weight: 600 (semibold) for Signal, 400 (regular) for Grid
- Letter-spacing: -0.02em for modern feel

### Usage
- Favicon: Central dot with one signal wave
- Header: Full icon + wordmark
- Dark mode: Invert colors or use white stroke

---

## Concept 2: Badge Shield

### Description
A security badge shape integrated with a shield, representing secure device access. The badge notch at top evokes physical access cards while the shield communicates security.

### Visual Elements

```
   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║     Concept: Badge Shield              ║
   ║                                       ║
   ║           ╭───╮                        ║
   ║          ╱     ╲                       ║
   ║         │       │                      ║
   ║         │  ✓✓✓  │  ← Verification     ║
   ║         │       │     marks           ║
   ║          ╲     ╱                       ║
   ║           ╰───╯                        ║
   ║             │                          ║
   ║         ╭──────╮                      ║
   ║        ╱        ╲                     ║
   ║       │ ════════ │  ← Shield body    ║
   ║        ╲        ╱                     ║
   ║         ╰──────╯                      ║
   ║                                       ║
   ║     SIGNALGRID                        ║
   ║                                       ║
   ╚═══════════════════════════════════════╝
```

### Colors
- Primary: `#1E293B` (Slate 800)
- Badge accent: `#10B981` (Emerald 500 - verified)
- Shield accent: `#3B82F6` (Blue 500)

### Typography
- Same as Concept 1

### Usage
- Favicon: Shield shape alone
- App icon: Badge + shield with checkmarks

---

## Concept 3: Device Chain

### Description
Connected device nodes forming a chain/network. Represents the ecosystem of shared devices managed by SignalGrid.

### Visual Elements

```
   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║     Concept: Device Chain             ║
   ║                                       ║
   ║          ●────●                        ║
   ║         ╱      ╲                       ║
   ║        ●        ●                      ║
   ║         ╲      ╱                       ║
   ║          ●────●                        ║
   ║           │  │                         ║
   ║          ●────●  ← Multiple            ║
   ║         ╱      ╲   device clusters    ║
   ║        ●        ●                      ║
   ║                                       ║
   ║     SIGNALGRID                        ║
   ║                                       ║
   ╚═══════════════════════════════════════╝
```

### Colors
- Primary: `#0F172A` (Slate 900)
- Accent: `#6366F1` (Indigo 500 - connectivity)
- Node inactive: `#94A3B8` (Slate 400)

### Typography
- Same as Concept 1

### Usage
- Favicon: 2x2 node cluster
- Marketing: Larger network visualization

---

## Logo Do's and Don'ts

### ✅ Do
- Use the logo at sizes >= 32px with adequate padding
- Maintain clear space (height of "S" in SignalGrid) around logo
- Use provided color variants for different backgrounds
- Use for favicon: simplified version (concept 1 or 2)

### ❌ Don't
- Stretch or distort the logo
- Add effects (shadows, gradients, glows)
- Change colors outside of approved palette
- Place on busy backgrounds without clear space
- Modify the icon apart from the wordmark

---

## Wordmark Variants

### Full Logo (Default)
```
SIGNALGRID
```
- Use for: Headers, marketing materials

### Icon Only (Favicon)
```
[Concept 1 or 2 simplified]
```
- Use for: Browser tab, app icon, small contexts

### Stacked (Mobile)
```
SIGNAL
GRID
```
- Use for: App splash, narrow containers

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Slate 900 | `#0F172A` | Primary text, dark backgrounds |
| Slate 800 | `#1E293B` | Secondary text, cards |
| Blue 500 | `#3B82F6` | Primary accent, CTAs |
| Blue 600 | `#2563EB` | Hover states |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| Cyan 400 | `#22D3EE` | Signal indicators, success |
| Emerald 500 | `#10B981` | Verified, secure |
| Amber 500 | `#F59E0B` | Warnings |
| Red 500 | `#EF4444` | Errors, alerts |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| White | `#FFFFFF` | Light backgrounds |
| Slate 100 | `#F1F5F9` | Light card backgrounds |
| Slate 200 | `#E2E8F0` | Borders |
| Slate 400 | `#94A3B8` | Muted text |

---

## Animation Guidelines

### Loading State
- Fade in logo with subtle scale (0.95 → 1.0)
- Duration: 300ms, ease-out
- Signal wave animation: ripple outward

### Interaction
- Hover: Subtle brightness increase
- Click: Scale down (1.0 → 0.98), scale back
- Don't over-animate; keep professional

---

## File Deliverables (When Ready)

### Required Formats
- SVG (primary, scalable)
- PNG (2x for retina)
- ICO (favicon)

### Sizes to Generate
- 16x16 (favicon)
- 32x32 (favicon retina)
- 128x128 (app icon small)
- 512x512 (app icon)
- 1024x1024 (marketing)

### Variants
- Light background (dark logo)
- Dark background (light logo)
- Monochrome (single color)
