# Phase 1: Core Foundation & Auth (End-to-End) - Research

**Researched:** 2026-10-03
**Domain:** Fullstack Web Application Scaffolding, JWT Authentication, RBAC, Field Stripping, System Settings, Audit Logging
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Design System & Color Tokens):** Clinical palette matching provided prototype:
  - `primary`: `#00685f` (Clinical Deep Teal)
  - `primary-container`: `#008378`
  - `secondary`: `#006b5f`
  - `secondary-container`: `#6df5e1` (Vibrant Mint)
  - `surface`: `#faf8ff` (Light clinical background)
  - `surface-container-lowest`: `#ffffff` (Card & modal background)
  - `on-surface`: `#131b2e` (High contrast text)
  - `on-surface-variant`: `#3d4947`
  - `error`: `#ba1a1a` & `error-container`: `#ffdad6`
- **D-02 (Typography):** Google Fonts `Plus Jakarta Sans` for UI copy/headings and `JetBrains Mono` for invoice numbers, batch tags, financial metrics, and code chips.
- **D-03 (Icons):** Google Material Symbols Outlined icons.
- **D-04 (Navigation & Header):** Fixed, compact top navigation bar maximizing vertical POS counter height, with active user badge and quick action shortcuts.
- **D-05 (Global Charges):** Empty configurable charges list by default; Owner can add percentage or fixed charges with active toggles.
- **D-06 (Expiry Alert Tiers):** Standard 3-tier warning thresholds (90d, 60d, 30d with Green/Yellow/Red indicators) plus Expired status.
- **D-07 (Receipt Format):** 80mm default thermal receipt width with 58mm compact format toggle option.
- **D-08 (Locale & Currency):** Default currency BDT (`৳`), DD/MM/YYYY dates in `Asia/Dhaka` timezone.
- **D-09 (Auth Flow):** JWT access tokens (15m) + refresh tokens in secure httpOnly cookies, with bcrypt password hashing.
- **D-10 (Seeding):** Automatic database seed script creating the default Owner user on initial startup.
- **D-11 (Role-Based Access Control):** Role checking on all API endpoints (`Owner` vs `Pharmacist`).
- **D-12 (Server-Side Field Serializer):** Response serializer middleware that strips `purchasePrice`, `purchasePricePerPiece`, `cost`, `profit`, and `stockValuation` fields from Pharmacist responses.
- **D-13 (Audit Log Engine):** Append-only MongoDB audit collection logging timestamps, user ID, username, action type, IP address, and payload diffs.

### The Agent's Discretion
- Project boilerplate directory layout (`/client` and `/server`).
- Toast notification library selection (e.g. `sonner`).
- Loading skeletons and error boundary implementations.

### Deferred Ideas (OUT OF SCOPE)
- None — all decisions mapped to Phase 1 scope.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User Auth & Token Management | API/Backend (`/server`) | Browser/Client (`/client`) | JWT verification and password hashing must reside securely on server; client stores session state and handles auto-refresh |
| Role-Based Field Stripping | API/Backend (`/server`) | — | Must be enforced on server before JSON serialization to eliminate security leaks |
| User Management & Permissions | API/Backend (`/server`) | Browser/Client (`/client`) | CRUD operations authenticated on server; rendered in Admin UI |
| Pharmacy Settings & Defaults | API/Backend (`/server`) | Browser/Client (`/client`) | Settings persisted in MongoDB; cached in React Query on frontend |
| Audit Logging Engine | API/Backend (`/server`) | — | Append-only database ledger written during sensitive operations |
| Responsive Clinical UI Shell | Browser/Client (`/client`) | — | React/Vite SPA with Tailwind clinical tokens and top navbar layout |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 establishes the complete fullstack foundation for PharmaERP. The stack is divided into a Node.js/Express TypeScript backend (`/server`) and a React/Vite TypeScript frontend (`/client`).

The backend architecture uses Express middleware for security (Helmet, CORS, rate limiting, cookie parsing) and an authentication pipeline:
1. `authMiddleware`: validates JWT access tokens from `Authorization: Bearer <token>` headers or cookies.
2. `roleGuard(['owner'])`: restricts admin routes (user management, settings update, audit logs).
3. `responseSerializer`: a global response interceptor/wrapper that recursively inspects response payloads and strips sensitive financial fields (`purchasePrice`, `cost`, `profit`, `stockValuation`) whenever `req.user.role === 'pharmacist'`.
4. `auditService`: an event logger writing to an append-only `AuditLog` collection.

The frontend is a single-page application built with Vite, React 19, Tailwind CSS (configured with the exact clinical color tokens and fonts), React Router 7, and TanStack Query. It delivers a top-bar navigation layout, login view, user management table, pharmacy settings editor, and live audit viewer.

**Primary recommendation:** Establish the monorepo root with separate `/server` and `/client` packages, implement the server-side field serializer middleware early with unit tests, and wire the Walking Skeleton end-to-end (login -> settings -> audit log).
</research_summary>

<standard_stack>
## Standard Stack

### Core Backend (`/server`)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `express` | ^4.21.0 | Web API framework | Standard, lightweight, excellent middleware support |
| `mongoose` | ^8.8.0 | MongoDB ODM | Decimal128 support, schema validation, transaction helpers |
| `jsonwebtoken` | ^9.0.2 | JWT generation and verification | Industry standard for access/refresh token pattern |
| `bcryptjs` | ^2.4.3 | Password hashing | Pure JS implementation, no native build dependencies on Windows |
| `zod` | ^3.23.8 | Schema validation | Type-safe runtime validation for request bodies and query params |
| `cors` | ^2.8.5 | Cross-origin resource sharing | Secures API endpoints to app origin |
| `helmet` | ^8.0.0 | HTTP security headers | OWASP best practice for Express APIs |
| `express-rate-limit` | ^7.4.1 | Rate limiting | Protects login and auth endpoints against brute force |
| `cookie-parser` | ^1.4.7 | Cookie parsing | Parses httpOnly refresh token cookies |
| `dotenv` | ^16.4.5 | Environment variable loading | Standard configuration management |

### Core Frontend (`/client`)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | ^19.0.0 | SPA UI library | Modern declarative UI component model |
| `react-dom` | ^19.0.0 | DOM renderer for React | Required companion for React |
| `vite` | ^6.0.0 | Frontend build tool | Sub-second HMR and fast production builds |
| `react-router-dom` | ^7.0.0 | Client-side routing | Standard declarative SPA routing |
| `@tanstack/react-query` | ^5.60.0 | Server state management | Caching, refetching, and optimistic updates |
| `tailwindcss` | ^3.4.15 | Utility CSS framework | Allows token-based design system matching clinical spec |
| `clsx` & `tailwind-merge` | ^2.1.1 / ^2.5.4 | Class name composition | Dynamic class joining without specificity conflicts |
| `sonner` | ^1.7.0 | Toast notifications | Beautiful, responsive toasts matching modern clinical UI |
| `lucide-react` | ^0.460.0 | Feather/Lucide icons | Clean companion to Material Symbols |

### Development & Testing
| Library | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.6.0 | Type checking for both client and server |
| `tsx` / `nodemon` | ^4.19.0 | Fast TypeScript execution for server development |
| `vitest` | ^2.1.0 | Unit and integration testing |
| `supertest` | ^7.0.0 | HTTP integration testing for Express endpoints |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Request & Response Pipeline

```
[Client Request]
       │
       ▼
[Rate Limiter] (blocks brute force)
       │
       ▼
[CORS & Helmet] (security headers)
       │
       ▼
[Cookie Parser & JSON Body Parser]
       │
       ▼
[Auth Middleware] (verifies JWT, attaches req.user)
       │
       ▼
[Role Guard Middleware] (verifies req.user.role in allowedRoles)
       │
       ▼
[Zod Validation Middleware] (validates req.body against schema)
       │
       ▼
[Route Controller & Service Logic]
       │
       ├─► [Audit Service] (logs sensitive actions to AuditLog collection)
       │
       ▼
[Response Serializer Wrapper]
       │
       ├─ If req.user.role === 'pharmacist':
       │    Recursively delete: purchasePrice, cost, profit, stockValuation
       │
       ▼
[HTTP 200/201 JSON Response to Client]
```

### Recommended Directory Structure

```
PharmaERP/
├── package.json              # Root script runner (concurrently dev, build)
├── .env.example
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/           # DB connection, env config
│       │   ├── db.ts
│       │   └── env.ts
│       ├── models/           # Mongoose schemas
│       │   ├── User.ts
│       │   ├── Settings.ts
│       │   ├── AuditLog.ts
│       │   └── Counter.ts
│       ├── middleware/       # Auth, role guard, serializer, rate limiter
│       │   ├── auth.ts
│       │   ├── roleGuard.ts
│       │   ├── serializer.ts
│       │   ├── validate.ts
│       │   └── errorHandler.ts
│       ├── controllers/      # Route controllers
│       │   ├── authController.ts
│       │   ├── userController.ts
│       │   ├── settingsController.ts
│       │   └── auditController.ts
│       ├── services/         # Business logic
│       │   ├── authService.ts
│       │   ├── settingsService.ts
│       │   └── auditService.ts
│       ├── routes/           # Express router definitions
│       │   ├── authRoutes.ts
│       │   ├── userRoutes.ts
│       │   ├── settingsRoutes.ts
│       │   ├── auditRoutes.ts
│       │   └── index.ts
│       ├── scripts/          # DB seeds & migrations
│       │   └── seed.ts
│       ├── types/            # TypeScript interfaces
│       └── server.ts         # Express app entry
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js    # Custom clinical theme tokens
    ├── index.html            # Plus Jakarta Sans & JetBrains Mono fonts
    └── src/
        ├── assets/
        ├── components/       # Shared UI components (Navbar, Button, Card, Modal, Input)
        │   ├── layout/
        │   │   ├── AppLayout.tsx
        │   │   └── TopNav.tsx
        │   └── common/
        ├── context/          # AuthContext
        │   └── AuthContext.tsx
        ├── pages/            # Page views
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Users.tsx
        │   ├── Settings.tsx
        │   └── AuditLogs.tsx
        ├── services/         # Axios API client & endpoints
        │   ├── api.ts
        │   ├── authApi.ts
        │   ├── userApi.ts
        │   └── settingsApi.ts
        ├── types/
        ├── index.css         # Tailwind directives & CSS variables
        ├── App.tsx           # Route tree with ProtectedRoute
        └── main.tsx
```

### Pattern 1: Server-Side Field Stripping Serializer

```typescript
// server/src/middleware/serializer.ts
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_PHARMACIST_FIELDS = new Set([
  'purchasePrice',
  'purchasePricePerPiece',
  'cost',
  'profit',
  'stockValuation',
  'margin',
]);

function stripSensitiveFields(data: any): any {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(stripSensitiveFields);
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!SENSITIVE_PHARMACIST_FIELDS.has(key)) {
        sanitized[key] = stripSensitiveFields(value);
      }
    }
    return sanitized;
  }
  return data;
}

export function responseSerializer(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    if ((req as any).user && (req as any).user.role === 'pharmacist') {
      const sanitizedBody = stripSensitiveFields(
        body && body.toObject ? body.toObject() : body
      );
      return originalJson(sanitizedBody);
    }
    return originalJson(body);
  };

  next();
}
```

### Pattern 2: Decimal128 Schema Serialization

```typescript
// Mongoose Decimal128 to string conversion
import mongoose from 'mongoose';

export const decimalSchemaOptions = {
  toJSON: {
    transform: (_doc: any, ret: any) => {
      for (const key of Object.keys(ret)) {
        if (ret[key] instanceof mongoose.Types.Decimal128) {
          ret[key] = ret[key].toString();
        }
      }
      return ret;
    },
  },
};
```
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT handling & cookie security | Custom token verification strings | `jsonwebtoken` + `cookie-parser` with httpOnly cookies | Token parsing and cryptographic timing attack risks |
| Password hashing | Custom MD5/SHA256 hashes | `bcryptjs` with salt rounds = 10 | Rainbow table vulnerability; bcrypt has built-in salt & work factor |
| Rate limiting | In-memory count dictionaries | `express-rate-limit` | Memory leaks, IP normalization, and header standard compliance |
| Form & Schema validation | Manual if/else string checks | `zod` | Complex nested schemas, type inference, sanitize/coercion |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Leaking Cost Data via Pharmacist Inspection
**What goes wrong:** Pharmacist opens DevTools Network tab and sees purchase prices on inventory or settings responses.
**Why it happens:** Relying on frontend UI to hide fields instead of server-side sanitization.
**How to avoid:** Response serializer middleware intercepts all outgoing responses and strips cost fields at the Express layer before JSON serialization.
**Warning signs:** JSON responses received by pharmacist contain `purchasePrice` or `cost` keys.

### Pitfall 2: Floating-point precision corruption on Decimal128
**What goes wrong:** Mongoose casts Decimal128 fields to JavaScript `Number`, causing 0.1 + 0.2 = 0.30000000000000004.
**Why it happens:** Using standard `Number` type in Mongoose schemas or converting Decimal128 with `parseFloat()`.
**How to avoid:** Use `mongoose.Schema.Types.Decimal128` and serialize to strings over the API.

### Pitfall 3: Initial Seeding Race Condition
**What goes wrong:** Concurrent server starts create multiple duplicate Owner accounts.
**Why it happens:** Checking `User.countDocuments()` without a unique index on `username`.
**How to avoid:** Unique index on `username` and atomic `User.findOneAndUpdate` / `User.create` with try-catch in the seed script.
</common_pitfalls>

<code_examples>
## Code Examples

### JWT Auth Middleware
```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  username: string;
  role: 'owner' | 'pharmacist';
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'dev-secret') as TokenPayload;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Role Guard Middleware
```typescript
// server/src/middleware/roleGuard.ts
import { Request, Response, NextFunction } from 'express';

export function roleGuard(allowedRoles: Array<'owner' | 'pharmacist'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
}
```
</code_examples>

<validation_architecture>
## Validation Architecture

### Automated Verification Commands
```bash
# Server tests
npm --prefix server test

# Server typecheck
npm --prefix server run typecheck

# Client typecheck & build
npm --prefix client run build

# End-to-end server integration tests
npm --prefix server run test:integration
```

### Core Test Cases for Phase 1
1. **Auth & RBAC Test:**
   - Owner can log in and receive valid access token + refresh cookie.
   - Pharmacist can log in and receive valid token.
   - Protected routes reject unauthenticated requests with 401.
   - Owner-only routes (e.g. `/api/settings`, `/api/users`) reject Pharmacist with 403.
2. **Field-Stripping Serializer Test:**
   - When Pharmacist requests user/pharmacy profile, no cost or purchase price data is present in the response body.
   - When Owner requests the same, all fields are present.
3. **Settings Persistence Test:**
   - Owner updates pharmacy name, receipt width (80mm vs 58mm), and global charges.
   - Updated settings persist and reflect across subsequent GET requests.
4. **Audit Log Test:**
   - Login, password reset, and settings update emit entries in `AuditLog` collection.
</validation_architecture>

---
*Phase: 01-core-foundation-auth-end-to-end*
*Research completed: 2026-10-03*
