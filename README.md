<p align="center">
  <img src="https://raw.githubusercontent.com/MURTAYES/ApplyKit/main/public/logo.png" alt="PharmaERP Logo" width="80" height="80" />
</p>

<h1 align="center">PharmaERP</h1>

<p align="center">
  <strong>Clinical Retail Pharmacy Management & High-Speed Point of Sale System</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-v1.0%20MVP-002F34?style=for-the-badge&logo=rocket" alt="Release v1.0" />
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Express%20%7C%20MongoDB-00A887?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/Currency-BDT%20(%E0%A7%B3)-97D8D0?style=for-the-badge&color=002F34&labelColor=97D8D0" alt="Currency" />
  <img src="https://img.shields.io/badge/Timezone-Asia%2FDhaka-D7F1B5?style=for-the-badge&color=002F34&labelColor=D7F1B5" alt="Timezone" />
  <img src="https://img.shields.io/badge/License-MIT-F1B5B9?style=for-the-badge&color=002F34&labelColor=F1B5B9" alt="License" />
</p>

---

## 📖 Overview

**PharmaERP** is a fullstack web-based pharmacy operations and billing system built for retail pharmacies. It guarantees strict **FEFO (First-Expired, First-Out)** batch traceability, multi-unit conversions (piece, strip, box), concurrency-safe inventory guards (`$gte` atomic updates inside replica-set transactions), thermal receipt printing, and role-based access control with zero financial margin leakage to counter staff.

---

## ✨ Key Features

### 🛒 High-Speed Counter POS Billing
- **Dual Instant Search**: Quick switch between **Brand / Trade Name (`F2`)** and **Generic Formulation (`F3`)** with `<300ms` type-ahead search.
- **FEFO Batch Selection**: Earliest-expiring batch recommended automatically with non-FEFO override warning tags.
- **Multi-Unit Hierarchy**: Live automatic price and stock derivation across `piece`, `strip`, and `box` units.
- **Price Overrides**: Cashier price adjustments recorded on invoice snapshots for audit review without blocking counter workflow.
- **Held Bills Sync**: Suspend and resume open customer carts across any counter terminal.
- **Split & Digital Payments**: Cash (with auto change-due calculation), Cards, and Bangladesh MFS (bKash, Nagad, Rocket, Upay).
- **Thermal Receipts**: Native browser print styling formatted for standard **58mm** and **80mm** thermal roll printers.

### 📦 Batch-Wise Inventory & Expiry Management
- **3-Bucket Stock Separation**: Individual batch tracking across `Sellable`, `Damaged`, and `Expired` inventory buckets.
- **Duplicate Batch Deduplication**: Automatically increments quantity on receiving identical item, batch number, and expiry date.
- **Visual Expiry Alerts**: Real-time warning badges for batches entering **90-day**, **60-day**, **30-day**, and **Expired** windows.
- **Low Stock Reorder Triggers**: Instant alerts when total sellable units fall below threshold.
- **Stock Movement Ledger**: Immutable append-only audit trail for all stock inflows, adjustments, write-offs, and sales deductions.

### 🛡️ Strict Role-Based Access Control (RBAC)
- **Owner Role**: Full administrative control, stock adjustments, supplier returns, user management, and executive profit/loss reports.
- **Pharmacist Role**: Focused counter billing and dispensing station.
- **Zero Cost Leakage**: Server-side serializer completely strips purchase prices, margins, profits, and stock valuation fields from pharmacist API responses.

### 📊 Role-Tailored Dashboards & Analytics
- **Executive Owner Dashboard**: Net sales, gross margins, payment distribution, category revenue breakdown, and weekly performance trends.
- **Pharmacist Dispensing Station**: Invoices dispensed today, active held carts, critical expiry watchlist, and counter refill alerts.
- **Exportable Reports**: Sales summary, profit & loss, price overrides audit, non-FEFO compliance report, stock valuation, and universal CSV exports.

### 🎨 Modern UI & Interactive Aesthetics
- Soft `#F3F7F6` canvas with curated spruce (`#002F34`), mint (`#97D8D0`), soft lime (`#D7F1B5`), and coral (`#F1B5B9`) design system.
- Interactive physics canvas on Login with floating 3D capsules that react to cursor movement and click shockwaves.
- Dedicated Privacy Policy and Contact Support pages.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, TanStack Query v5, Tailwind CSS, Lucide / Material Symbols |
| **State & Math** | Zustand, Decimal.js (arbitrary-precision money math), date-fns |
| **Backend** | Node.js (v20+ / v22 LTS), Express, TypeScript, Zod validation |
| **Database & ODM** | MongoDB Atlas (Replica Set for multi-document transactions), Mongoose (Decimal128) |
| **Security & Auth** | JWT access + refresh token rotation, bcryptjs, Helmet, CORS, Express-Rate-Limit |

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v20+` or `v22 LTS`
- MongoDB Atlas cluster or local MongoDB replica set (`mongodb://localhost:27017/?replicaSet=rs0`)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/MURTAYES/PharmaERP.git
cd PharmaERP

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in `server/`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pharmaerp?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-super-secret-access-key-here-32chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-32chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Demo Accounts & Sample Inventory

```bash
cd server
npm run seed
```

Default credentials:
- **Owner / Admin**: `admin` / `admin123`
- **Pharmacist**: `pharmacist` / `pharma123`

### 4. Run Development Servers

In terminal 1 (Backend API):
```bash
cd server
npm run dev
```

In terminal 2 (Frontend SPA):
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| <kbd>F2</kbd> | Open POS Billing Terminal / Search Product by Brand | Global |
| <kbd>F3</kbd> | Search Inventory & POS by Generic Formulation | Global |
| <kbd>Esc</kbd> | Close active modal / clear search focus | Global |

---

## 📂 Project Structure

```text
PharmaERP/
├── client/                     # React + Vite Frontend
│   ├── public/                 # Favicon and logo assets
│   ├── src/
│   │   ├── assets/             # Brand images and vectors
│   │   ├── components/         # Modals, forms, tables, POS and layout components
│   │   ├── context/            # AuthContext and state providers
│   │   ├── pages/              # Login, POS, Dashboard, Inventory, Invoices, Returns, Reports, etc.
│   │   ├── services/           # Axios API services
│   │   └── types/              # TypeScript interface contracts
│   └── index.html
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # Database connection and environment config
│   │   ├── controllers/        # Business logic controllers
│   │   ├── middleware/         # Auth, RBAC serializer, rate limiters, validation
│   │   ├── models/             # Mongoose schemas with Decimal128
│   │   ├── routes/             # Express API route endpoints
│   │   ├── scripts/            # Database seed and backup utilities
│   │   └── services/           # Atomic transactions, FEFO calculations, report aggregations
│   └── tests/                  # Security, concurrency, and integration tests
│
└── .planning/                  # GSD planning, milestone history & requirements archive
```

---

## 🧪 Testing & Production Build

```bash
# Run backend tests
cd server
npm test

# Build frontend and backend for production
npm --prefix client run build
npm --prefix server run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
