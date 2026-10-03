<p align="center">
  <a href="https://github.com/MURTAYES/PharmaERP">
    <img src="https://raw.githubusercontent.com/MURTAYES/PharmaERP/main/client/public/logo.png" alt="PharmaERP Logo" width="90" />
  </a>
</p>

<h1 align="center">PharmaERP</h1>

<p align="center">
  A retail pharmacy management system and high-speed POS terminal designed for clinical medicine dispensing, batch-wise FEFO inventory tracking, and multi-unit conversions.
</p>

<p align="center">
  <a href="#core-capabilities">Capabilities</a> •
  <a href="#architecture--concurrency">Architecture</a> •
  <a href="#role-access-matrix">Role Control</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a>
</p>

---

## 📌 Core Capabilities

### ⚡ Fast Counter POS & Dispensing
* **Dual Instant Search**: Query products by **Brand / Trade Name (`F2`)** or active **Generic Formulation (`F3`)** with sub-300ms type-ahead search.
* **FEFO Batch Allocation**: Automatically allocates the earliest-expiring batch first. Overriding to a non-FEFO batch is permitted but explicitly flagged on the invoice.
* **Multi-Unit Pricing**: Live price derivation across **Piece**, **Strip**, and **Box** based on configured conversion ratios.
* **Price Overrides & Held Bills**: Cashiers can adjust unit prices on the fly (logged for owner review) and suspend/resume carts across counter terminals.
* **Thermal Printing**: Native browser-styled `@page` print output for 58mm and 80mm roll printers.

### 📦 Batch-Wise Inventory & Expiry Watch
* **Three-Tier Stock Buckets**: Isolates **Sellable**, **Damaged**, and **Expired** quantities per batch to prevent dispensing compromised medicine.
* **Duplicate Batch Merging**: Receiving an existing `itemId + batchNumber + expiryDate` automatically aggregates quantities without creating orphan entries.
* **Expiry Windows**: Visual alert thresholds at **90**, **60**, and **30 days** before expiration.
* **Append-Only Stock Ledger**: Every movement (receive, counter deduction, damage transfer, return) writes an immutable record to the ledger.

### 🛡️ Strict Role-Based Privacy (RBAC)
* **Owner**: Full access to purchase costs, supplier returns, gross/net margins, P&L statements, staff management, and system logs.
* **Pharmacist**: Streamlined counter interface with clinical dispensing statistics. All cost prices, purchase data, and profit margins are **stripped at the API level** before responses leave the server.

---

## 🏗️ Architecture & Concurrency

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 SPA (Vite + TS)                    │
│   Tailwind CSS • Zustand • TanStack Query • Decimal.js      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST (JWT Auth)
┌──────────────────────────────▼──────────────────────────────┐
│                    Node.js + Express API                    │
│   Zod Validation • Field-Stripping Serializer • RBAC Guard  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Multi-Document ACID Transactions
┌──────────────────────────────▼──────────────────────────────┐
│               MongoDB Atlas (Replica Set)                   │
│   Decimal128 Precision • $gte Concurrency Stock Guard       │
└─────────────────────────────────────────────────────────────┘
```

### Money Precision & Concurrency Guarantees
1. **Decimal128 Precision**: Currency calculations avoid standard IEEE 754 floating-point rounding errors by using `Decimal128` in MongoDB and `decimal.js` on both client and server.
2. **Atomic Stock Guard**: Checkouts execute inside MongoDB replica-set transactions with conditional `$gte` queries on `qtySellable`, preventing negative stock under concurrent requests.

---

## 👥 Role Access Matrix

| Feature / Area | Pharmacist | Owner (Admin) |
|---|:---:|:---:|
| **POS Billing Terminal (`F2`)** | ✅ Full Access | ✅ Full Access |
| **Inventory Catalog & Search (`F3`)** | ✅ Retail Price Only | ✅ Includes Cost & Margin |
| **Batch Stock Receiving** | ✅ Auto Cost-Missing | ✅ Full Cost Entry |
| **Stock Bucket Adjustments** | ❌ Read Only | ✅ With Mandatory Audit Reason |
| **Customer Returns & Credit Notes** | ✅ Process Return | ✅ Process Return |
| **Supplier Returns (`SRT-000001`)** | ❌ Restricted | ✅ Full Access |
| **Executive Reports (P&L, Ledger, Valuation)** | ❌ Hidden & Restricted | ✅ Full Access |
| **User & Pharmacy Settings** | ❌ Hidden & Restricted | ✅ Full Access |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** v20+ or v22 LTS
* **MongoDB** (Atlas cluster or local replica set)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/MURTAYES/PharmaERP.git
cd PharmaERP

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Setup

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/pharmaerp?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-32-character-access-secret
JWT_REFRESH_SECRET=your-32-character-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Demo Data

Populate default medicine items, unit hierarchies, and demo accounts:
```bash
cd server
npm run seed
```

**Default Accounts:**
* **Owner:** `admin` / `admin123`
* **Pharmacist:** `pharmacist` / `pharma123`

### 4. Run Development Servers

```bash
# Terminal 1 - Backend API
cd server
npm run dev

# Terminal 2 - Frontend SPA
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description | Location |
|---|---|---|
| <kbd>F2</kbd> | Navigate to POS Billing / Focus Brand Name Search | Global |
| <kbd>F3</kbd> | Focus Generic Formulation Search | POS & Inventory |
| <kbd>Esc</kbd> | Dismiss active modal or clear search input | Global |

---

## 📦 Production Build

```bash
# Run test suite
npm --prefix server test

# Compile production bundles
npm --prefix client run build
npm --prefix server run build
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
