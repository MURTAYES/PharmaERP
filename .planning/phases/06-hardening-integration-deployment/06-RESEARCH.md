# Phase 6: Hardening, Integration & Deployment - Research

**Date:** 2026-10-03  
**Status:** Complete  
**Phase:** 6 — Hardening, Integration & Deployment  

---

## 1. Technical Architecture & Security Audits

### A. Zero Cost / Profit Field Leakage Guarantee
- Pharmacist role API responses must NEVER contain:
  - `purchasePricePerPiece`
  - `purchaseCostPerPiece`
  - `totalCost`
  - `cost`
  - `grossProfit`
  - `profit`
  - `marginPercent`
- Enforced at server response serializer level (`serializer.ts`).

### B. Concurrency Guard Verification
- Under high-concurrency race conditions (multiple terminals checking out the exact same batch at the same millisecond):
  - MongoDB multi-document transactions with conditional atomic update `{ _id: batchId, qtySellable: { $gte: qty } }` ensure stock never goes below 0.
  - Transactions that encounter insufficient stock abort cleanly and return `400 Bad Request` with an exact error message.

### C. Backup & Restore Operations
- MongoDB Atlas free/production tier backup scripts using `mongodump` and `mongorestore` with timestamped archive directory creation.

### D. Production Configuration & Environment Validation
- Strict environment variable schema validation:
  - `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`.
- Clean fullstack build verification.
