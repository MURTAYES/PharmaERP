# Roadmap: PharmaERP

## Milestones

- ✅ **v1.0 MVP** — Retail Pharmacy POS & Inventory Suite (Phases 1–6, Shipped 2026-10-03) — [Milestone Archive](file:///g:/code/PharmaERP/.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Live Pharmacist Metrics & Shift Analytics** — Phases 7–8 (In Progress)

---

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6) — SHIPPED 2026-10-03</summary>

- [x] **Phase 1: Core Foundation & Auth (End-to-End)** (3/3 plans) — completed 2026-10-03
- [x] **Phase 2: Inventory & Stock Management (End-to-End)** (4/4 plans) — completed 2026-10-03
- [x] **Phase 3: Point of Sale & Billing (End-to-End)** (5/5 plans) — completed 2026-10-03
- [x] **Phase 4: Returns & Credit Notes (End-to-End)** (3/3 plans) — completed 2026-10-03
- [x] **Phase 5: Analytics & Reporting Suite (End-to-End)** (4/4 plans) — completed 2026-10-03
- [x] **Phase 6: Hardening, Integration & Deployment** (2/2 plans) — completed 2026-10-03

</details>

### Milestone v1.1 Phases

- [ ] **Phase 7: Backend Pharmacist Operations & Shift KPI Aggregation APIs** — Dedicated endpoint for real-time shift dispensing metrics, dosage form breakdown, and counter statistics.
- [ ] **Phase 8: Frontend Pharmacist Dashboard Live Integration & Real-Time Counter Widgets** — Connect live aggregation pipelines to Pharmacist Dashboard, FEFO batch card, held bills quick-resume drawer, and instant thermal receipt modal.

---

## Phase Details

### Phase 7: Backend Pharmacist Operations & Shift KPI Aggregation APIs
**Goal**: Build a dedicated, secure backend aggregation service and route (`GET /api/reports/pharmacist-kpis`) that aggregates real-time shift dispensing data: today's invoices count, total units dispensed (pieces/strips/boxes), category/dosage breakdown, and customer returns processed.
**Mode:** mvp  
**Depends on**: Phase 6  
**Requirements**: [PHARM-01, PHARM-02]  
**Success Criteria**:
1. `GET /api/reports/pharmacist-kpis` responds in < 150ms with live today's dispensing counts and zero mock data.
2. Form-factor breakdown accurately computes pieces dispensed per medicine category/form (Tablets, Syrups, Capsules, Injections).
3. Field serializer guarantees zero cost or profit leakage in the pharmacist KPI payload.

### Phase 8: Frontend Pharmacist Dashboard Live Integration & Real-Time Counter Widgets
**Goal**: Update the frontend Pharmacist Dashboard to consume live shift aggregation APIs, display real-time FEFO expiry watchlists with shelf locations, connect the held-bills queue with one-click cart restoration, and enable direct thermal receipt printing.
**Mode:** mvp  
**Depends on**: Phase 7  
**Requirements**: [PHARM-03, PHARM-04, PHARM-05, PHARM-06]  
**Success Criteria**:
1. Pharmacist dashboard cards update live on each counter checkout without manual refresh.
2. Urgent FEFO watchlist displays real batches with exact expiration countdowns and shelf coordinates.
3. Held bills drawer allows immediate one-click resumption into the POS billing terminal.
4. All dummy/placeholder stats and rows are replaced with live MongoDB queries.
