# Hero Section — Dark Crimson Redesign

**Date:** 2026-04-21  
**File:** `src/components/landing/home-page.tsx`

## Summary

Full rewrite of the landing page hero section, inspired by the Sagenex brand reference image. Red (#C41E3A) is primary color, green (#00b386) is secondary.

## Background & Atmosphere

- Base: `#0f0005` (near-black crimson)
- Radial gradient: `ellipse 90% 65% at 50% 42%` — `#7a0010` → `#3d0008` → `#0f0005`
- Three animated blobs: large red glow top-center (18% opacity), two small green glows (5–6% opacity) for brand secondary accents

## Typography

- **Watermark wordmark:** `SAGENEX` at `clamp(72px, 15vw, 220px)`, `font-weight: 900`, white at 10% opacity — decorative background texture
- **Headline:** 3 lines — `"A Civilization of"` / `"Heritage &"` / `"Innovation."` — white for first two, `#00b386` for third. Size: `clamp(36px, 5.5vw, 76px)`

## Layout

Three-column center section (desktop only):
- **Left col:** AI + precision tagline, right-aligned, `text-white/65`
- **Center col:** `sggold.png` logo with crimson drop-shadow glow
- **Right col:** Mission paragraph, `text-white/55`

Mobile collapses to centered logo + single subtitle paragraph.

## Interactive Elements

- **Floating cards** (XL+ only): dark glass treatment — `rgba(255,255,255,0.07)` bg, `blur(14px)`, `rgba(255,255,255,0.12)` border. Existing float animations retained.
- **CTAs:** Red primary (`btn-cta-primary`), glass secondary (`rgba(255,255,255,0.08)` bg, white border)
- **Stats bar:** Dark glass — `rgba(255,255,255,0.06)` bg, `divide-white/10`, `blur(16px)`
- **Trust strip:** `rgba(0,0,0,0.3)` bg, `text-white/40`, green check marks

## Removed

- `CityscapeIllustration` component (no longer imported)
- Eyebrow pill ("India's Most Trusted Wealth Ecosystem")
- Light-theme blobs and gradient washes
