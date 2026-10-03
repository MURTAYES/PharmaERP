---
phase: "01"
slug: "core-foundation-auth-end-to-end"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-03"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Supertest |
| **Config file** | `server/vitest.config.ts` |
| **Quick run command** | `npm --prefix server test` |
| **Full suite command** | `npm --prefix server test && npm --prefix client run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm --prefix server test`
- **After every plan wave:** Run `npm --prefix server test && npm --prefix client run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01, AUTH-02 | T-01-01 | Password hashed with bcrypt; JWT issued | unit | `npm --prefix server test src/tests/auth.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-03, AUTH-04 | T-01-02 | Rate limiter triggers after max attempts; refresh tokens validated | unit | `npm --prefix server test src/tests/auth.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-05 | T-01-03 | Pharmacist responses stripped of cost/profit fields | unit | `npm --prefix server test src/tests/serializer.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SYS-01, SYS-02, SYS-03, SYS-04, SYS-05 | T-01-04 | Settings CRUD restricted to Owner role | integration | `npm --prefix server test src/tests/settings.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SYS-06, SYS-07 | T-01-05 | User CRUD and audit logging recorded | integration | `npm --prefix server test src/tests/userAudit.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | SYS-01..07, AUTH-01..05 | T-01-SC | Client builds with zero type or lint errors | e2e/build | `npm --prefix client run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/package.json` — Vitest, supertest, tsx dependencies
- [ ] `server/vitest.config.ts` — test configuration
- [ ] `server/src/tests/auth.test.ts` — test stubs for AUTH-01..04
- [ ] `server/src/tests/serializer.test.ts` — test stubs for AUTH-05
- [ ] `server/src/tests/settings.test.ts` — test stubs for SYS-01..05
- [ ] `server/src/tests/userAudit.test.ts` — test stubs for SYS-06..07

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive clinical design verification | D-01, D-02, D-04 | Visual layout fidelity & responsive rendering | Verify login view, top navbar, settings modal, and user management table match clinical color palette and typography across desktop/tablet viewport widths |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-03
