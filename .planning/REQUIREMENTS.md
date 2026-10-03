# Requirements: PharmaERP v1.1

**Defined:** 2026-10-03  
**Milestone:** v1.1 — Pharmacist Live Operational Metrics & Shift Analytics  
**Core Value:** Accurate batch-wise stock with expiry visibility and fast counter billing — every sale traces back to a specific batch, every price override is recorded, and stock can never go negative through concurrent operations.

---

## v1.1 Requirements

### Pharmacist Operational KPIs & Shift Analytics
- [ ] **PHARM-01**: Backend aggregation endpoint `GET /api/reports/pharmacist-kpis` computing live shift metrics: today's invoices billed count, total units dispensed (in pieces, strips, and boxes), and customer returns processed.
- [ ] **PHARM-02**: Live category & dosage form dispensing breakdown (Tablets, Syrups, Capsules, Injections) calculated from actual invoices issued today.
- [ ] **PHARM-03**: Live urgent FEFO batch expiry watchlist streaming batches in critical/expired state (< 30 days) with shelf location and remaining sellable pieces.
- [ ] **PHARM-04**: Live counter low-stock refill queue displaying items with total sellable units below reorder threshold.
- [ ] **PHARM-05**: Real-time counter held-bills drawer showing suspended customer bills with instant one-click resume into the POS cart.
- [ ] **PHARM-06**: Live recent counter dispensing activity table displaying the latest invoices with instant thermal receipt print action.

---

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| PHARM-01 | Phase 7 | Pending |
| PHARM-02 | Phase 7 | Pending |
| PHARM-03 | Phase 8 | Pending |
| PHARM-04 | Phase 8 | Pending |
| PHARM-05 | Phase 8 | Pending |
| PHARM-06 | Phase 8 | Pending |

*Coverage: 6 requirements mapped across Phase 7 and Phase 8.*
