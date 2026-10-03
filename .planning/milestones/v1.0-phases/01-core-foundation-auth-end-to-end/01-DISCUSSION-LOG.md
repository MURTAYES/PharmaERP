# Phase 1: Core Foundation & Auth (End-to-End) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-03
**Phase:** 01-core-foundation-auth-end-to-end
**Areas discussed:** Pharmacy Settings & Defaults, UI Shell & Theme Design

---

## Pharmacy Settings & Defaults

### Global Charges & Receipt Presets

| Option | Description | Selected |
|--------|-------------|----------|
| Option 1 | Default VAT disabled (0%) with option to enable, default 80mm receipt width with 58mm toggle | |
| Option 2 | Default VAT enabled at 5% (BDT standard retail), default 80mm receipt width | |
| Option 3 | Configurable empty charge list by default, let owner add custom percentage or fixed charges anytime | ✓ |

**User's choice:** Configurable empty charge list by default, let owner add custom percentage or fixed charges anytime.
**Notes:** Owner has full control over adding VAT or service charges when desired.

### Expiry Alert Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Option 1 | Standard 90, 60, and 30 day warning tiers with color coding (Green/Yellow/Red) | ✓ |
| Option 2 | Two-tier warning: 60 and 30 days plus Expired alert | |
| Option 3 | Custom configurable day inputs with 90/60/30 presets | |

**User's choice:** Standard 90, 60, and 30 day warning tiers with color coding (Green/Yellow/Red).

---

## UI Shell & Theme Design

### Navigation Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Option 1 | Collapsible left sidebar navigation with quick-key shortcuts and role-tailored menu items | |
| Option 2 | Fixed compact top navigation bar maximizing vertical screen space for POS counters | ✓ |
| Option 3 | Hybrid: Top bar for counter status & user profile, collapsible left sidebar for app sections | |

**User's choice:** Fixed compact top navigation bar maximizing vertical screen space for POS counters.

### Visual Theme & Design Spec

**User's choice:** Provided comprehensive Clinical Suite dashboard HTML prototype with Tailwind color palette (`primary: #00685f`, `primary-container: #008378`, `secondary-container: #6df5e1`, `surface: #faf8ff`), typography (`Plus Jakarta Sans` and `JetBrains Mono`), and Material Symbols Outlined icons.

---

## The Agent's Discretion

- Project folder scaffolding setup (`/client` and `/server`).
- Toast notification library selection (e.g. Sonner) styled with clinical palette tokens.
- Loading skeletons and state styling.

## Deferred Ideas

- None — discussion stayed strictly within Phase 1 scope.

---

*Phase: 01-core-foundation-auth-end-to-end*
*Discussion log generated: 2026-10-03*
