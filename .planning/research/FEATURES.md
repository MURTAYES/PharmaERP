# Feature Landscape

**Domain:** Retail Pharmacy Management
**Researched:** 2026-10-03

## Table Stakes (Must Have)

Features users expect from any pharmacy management system. Missing these = system rejected.

### Inventory Management
- **Batch tracking with expiry dates** — Core pharmacy requirement; regulatory and safety necessity
- **FEFO batch rotation** — Industry standard for pharmaceutical stock movement
- **Three bucket types (sellable/damaged/expired)** — Standard for pharmaceutical inventory state tracking
- **Stock receiving with duplicate detection** — Prevents data entry errors on batch receipt
- **Low stock alerts** — Prevents stockouts of essential medicines
- **Expiry alerts (configurable windows)** — Industry standard: 90/60/30 day windows
- **Stock adjustment with audit trail** — Required for inventory reconciliation

### Billing / POS
- **Fast item search (<300ms)** — Counter speed is make-or-break for pharmacy POS
- **Multi-unit sales (piece/strip/box)** — Fundamental to how medicines are sold
- **Price display during billing** — Standard POS requirement
- **Sequential invoice numbering** — Regulatory and audit requirement
- **Receipt printing** — Physical receipt is expected by customers
- **Payment method tracking** — Cash, card, mobile payments are table stakes

### Returns
- **Sales returns from invoice** — Standard for any retail system
- **Return to correct batch** — Required for accurate batch-level inventory
- **Credit note generation** — Standard return documentation

### Authentication & Access Control
- **Role-based access (owner/pharmacist)** — Minimum viable security model
- **Cost/profit hidden from staff** — Standard pharmacy practice; business-critical
- **Login with password** — Basic security requirement

### Reporting
- **Sales summary (daily, by user, by payment method)** — Basic business intelligence
- **Stock valuation** — Owner needs to know inventory worth
- **Expiry report** — Required for supplier return planning

## Differentiators (Competitive Advantage)

Features that set this system apart from basic pharmacy POS.

### Smart Billing
- **FEFO suggestion with soft enforcement** — Most systems either hard-enforce or ignore; soft enforcement with flagging is sophisticated
- **Price override tracking and reporting** — Most pharmacy POS allow overrides but don't report them
- **Hold/resume bills** — Advanced POS feature; critical for counter efficiency
- **Invoice-level discount with charge layering** — More flexible than most basic systems

### Traceability & Audit
- **Non-FEFO sales report** — Unique reporting that catches pharmacy malpractice
- **Stock movement ledger** — Full traceability per batch, per movement type
- **Immutable audit log** — Enterprise-grade audit trail
- **Cost-missing flagging** — Smart workaround for pharmacist stock receiving

### Business Intelligence
- **Profit report (revenue minus cost snapshot)** — Not common in basic POS
- **Price override report with user attribution** — Enables owner oversight
- **Dashboard with actionable tiles** — Real-time business snapshot

### Supplier Returns
- **Separate supplier return document type (SRT-)** — Clean separation from sales; common gap in basic systems
- **Bucket-specific returns** — Return expired/damaged stock specifically

## Anti-Features (Deliberately NOT Building)

| Anti-Feature | Why to Avoid |
|-------------|-------------|
| Automatic price rounding per line | Spec mandates no rounding except grand total — line-level rounding causes audit discrepancies |
| Hard FEFO enforcement (block non-FEFO sales) | Slows counter operations; pharmacy needs flexibility |
| Invoice editing/deletion | Destroys audit trail; corrections must be via returns only |
| Client-side total computation (trusted) | Server must recompute everything — client totals are never trusted |
| Floating-point money math | Causes accumulating rounding errors in financial calculations |

## Feature Dependencies

```
Authentication → Item Master → Stock Receiving → Billing → Returns
                                    ↓
                              Alerts & Dashboard
                                    ↓
                              Reports & Analytics
```

## Sources

- Pharmacy POS feature comparison surveys
- FEFO/FIFO best practices for pharmaceutical inventory
- Retail pharmacy management system reviews
