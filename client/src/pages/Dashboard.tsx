import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Card } from '../components/common/Card.tsx';
import { Badge } from '../components/common/Badge.tsx';

export function Dashboard() {
  const { user, role } = useAuth();

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Top Operational Greeting Banner */}
      <div className="w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-clinical border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">medical_information</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {role === 'owner' ? 'Administrator Clinical Overview' : 'Pharmacist Dispensary Terminal'}
              </h1>
              <Badge variant="secondary" dot>
                Live telemetry
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Welcome back, <span className="font-bold text-on-surface">{user?.fullName}</span>. Terminal session
              active with role <span className="font-semibold text-primary">[{role?.toUpperCase()}]</span>.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/inventory"
            className="h-10 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container shadow-clinical-glow transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">medication</span>
            <span>Open Inventory</span>
          </Link>

          {role === 'owner' && (
            <>
              <Link
                to="/users"
                className="h-10 px-4 rounded-xl bg-surface-container-low text-on-surface font-semibold text-xs hover:bg-surface-container transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">person_add</span>
                <span>Manage Users</span>
              </Link>
              <Link
                to="/settings"
                className="h-10 px-4 rounded-xl bg-surface-container-low text-on-surface font-semibold text-xs hover:bg-surface-container transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
                <span>Pharmacy Settings</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Metric Overview (Stats Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Stat 1: Inventory Management */}
        <Link to="/inventory">
          <Card hoverEffect className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Inventory Control</span>
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-primary font-mono">ACTIVE</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-secondary font-semibold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Batch & Expiry System Live</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-mono">
              <span>FEFO Suggestion: Ready</span>
              <span>Search: &lt;300ms</span>
            </div>
          </Card>
        </Link>

        {/* Stat 2: Security & Field Stripping */}
        <Card hoverEffect className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Field Stripping</span>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-on-secondary-fixed-variant">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-on-surface font-mono">ENFORCED</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
              <span>Zero cost leaks to pharmacist</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span>Layer: Middleware</span>
            <span>Leak Count: 0</span>
          </div>
        </Card>

        {/* Stat 3: Active Session */}
        <Card hoverEffect className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Current Session</span>
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">account_circle</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-extrabold text-on-surface truncate">@{user?.username}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary font-semibold">
              <Badge variant={role === 'owner' ? 'primary' : 'secondary'}>{role?.toUpperCase()}</Badge>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span>Access Expiry: 15m</span>
            <span>Refresh: 7d</span>
          </div>
        </Card>

        {/* Stat 4: Phase 2 Delivery */}
        <Card hoverEffect className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Phase 2 Delivery</span>
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-primary font-mono">PHASE 2</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
              <span>Inventory & Stock Slices Live</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span>Next: Point of Sale (Ph 3)</span>
            <span>Slice: MVP</span>
          </div>
        </Card>
      </div>

      {/* Modules Roadmap Grid */}
      <div className="w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-clinical border border-outline-variant/30 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-on-surface tracking-tight">Phase 1 Walking Skeleton — Live Modules</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Operational slices available in Phase 1 and preview of subsequent phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Settings */}
          <Link
            to={role === 'owner' ? '/settings' : '#'}
            className={`p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-between transition-all ${
              role === 'owner' ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer' : 'opacity-80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">settings</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Pharmacy Profile & Settings</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Manage dispensary branding, receipt widths (80mm/58mm), global VAT/charges, and 90/60/30 expiry windows.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs font-semibold text-primary">
              <span>{role === 'owner' ? 'Configure Settings →' : 'Owner Controlled'}</span>
              <Badge variant="success">Active in Phase 1</Badge>
            </div>
          </Link>

          {/* Module 2: Users */}
          <Link
            to={role === 'owner' ? '/users' : '#'}
            className={`p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-between transition-all ${
              role === 'owner' ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer' : 'opacity-80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">User & RBAC Administration</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Create staff logins, assign Owner vs Pharmacist roles, manage passwords, and toggle active statuses.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs font-semibold text-primary">
              <span>{role === 'owner' ? 'Manage Staff →' : 'Owner Controlled'}</span>
              <Badge variant="success">Active in Phase 1</Badge>
            </div>
          </Link>

          {/* Module 3: Audit Log */}
          <Link
            to={role === 'owner' ? '/audit' : '#'}
            className={`p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-between transition-all ${
              role === 'owner' ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer' : 'opacity-80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Append-Only Audit Engine</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  View immutable audit trails of authentication events, user updates, and settings changes.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs font-semibold text-primary">
              <span>{role === 'owner' ? 'Inspect Audit Log →' : 'Owner Controlled'}</span>
              <Badge variant="success">Active in Phase 1</Badge>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
