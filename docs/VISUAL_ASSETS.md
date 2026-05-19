# SignalGrid Visual Assets

This document tracks the initial SVG brand assets in this repository and how to use them consistently.

> These visuals are **brand assets** and conceptual product framing only. They are not production proof, compliance proof, or deployment claims. Keep all usage aligned to [CLAIM_BOUNDARIES.md](./CLAIM_BOUNDARIES.md).

## Asset inventory

### `public/signalgrid-logo.svg`
- **Purpose:** Primary SignalGrid logo with mark + wordmark.
- **Use it for:** README/header placement, docs title areas, basic website masthead usage.
- **Notes:** Designed around warm charcoal, off-white, and muted teal brand palette.

### `public/signalgrid-logo-mark.svg`
- **Purpose:** Icon-only monogram mark.
- **Use it for:** Favicon foundation, avatar/icon usage, compact placements.
- **Notes:** Constructed to hold up at small sizes and in monochrome contexts.

### `docs/assets/github-social-preview.svg`
- **Purpose:** Default social preview card for GitHub sharing surfaces.
- **Use it for:** Open Graph image export source and documentation previews.
- **Notes:** 1200×630 aspect ratio, restrained enterprise styling, no stock imagery.

### `docs/assets/readme-hero.svg`
- **Purpose:** Conceptual architecture-style hero visual for repo documentation.
- **Use it for:** README hero section and explanatory docs.
- **Notes:** Shows `Identity + Device + Session Context → SignalGrid → Allow / Deny / Step-Up` and explicitly labels itself as conceptual.

### `docs/assets/linkedin-teaser.svg`
- **Purpose:** Minimal teaser graphic for LinkedIn or similar social posts.
- **Use it for:** Introductory launch/update posts with restrained positioning.
- **Notes:** Includes minimal logo treatment and a non-hype one-line message.

## PNG export guidance (when required)

Prefer using source SVG directly whenever possible. If a target platform requires PNG:

1. Export at 1x, 2x, and 3x sizes from the original SVG.
2. Keep aspect ratio fixed (do not crop logo geometry).
3. Keep color values unchanged from the SVG source.
4. Use transparent background only when the destination surface supports it; otherwise preserve warm charcoal background.
5. Do not add glow, bevel, or neon effects during export.

Suggested CLI example with `rsvg-convert`:

```bash
rsvg-convert -w 1200 -h 630 docs/assets/github-social-preview.svg -o docs/assets/github-social-preview.png
```

## Usage reminder

- Keep claims restrained and MVP/demo-safe.
- Avoid attaching these assets to statements implying certified compliance or guaranteed production outcomes.
- Keep visual consistency with [BRAND_SYSTEM.md](./BRAND_SYSTEM.md) and [startup/branding/brand.md](../startup/branding/brand.md).
