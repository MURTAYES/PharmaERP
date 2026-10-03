import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { Badge } from '../common/Badge.tsx';

export function TopNav() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
      isActive
        ? 'bg-primary-container text-on-primary-container shadow-sm'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md z-40 border-b border-surface-container shadow-sm px-4 md:px-8 flex items-center justify-between">
      {/* Brand & System Title */}
      <div className="flex items-center gap-6">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">medical_services</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-primary leading-none">PharmERP</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-on-surface-variant scale-90 -ml-1">
              Clinical Suite
            </span>
          </div>
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
          <NavLink to="/dashboard" className={navItemClass}>
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span>Dashboard</span>
          </NavLink>

          {/* Placeholders for upcoming phases */}
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant/40 cursor-not-allowed"
            title="Phase 2 (Inventory & Stock Management)"
          >
            <span className="material-symbols-outlined text-[18px]">medication</span>
            <span>Inventory</span>
            <span className="text-[9px] bg-surface-container-high text-on-surface-variant px-1 rounded">v1.2</span>
          </span>

          <span
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant/40 cursor-not-allowed"
            title="Phase 3 (POS & Billing)"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>Billing</span>
            <span className="text-[9px] bg-surface-container-high text-on-surface-variant px-1 rounded">v1.3</span>
          </span>

          <span
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant/40 cursor-not-allowed"
            title="Phase 4 (Returns)"
          >
            <span className="material-symbols-outlined text-[18px]">assignment_return</span>
            <span>Returns</span>
            <span className="text-[9px] bg-surface-container-high text-on-surface-variant px-1 rounded">v1.4</span>
          </span>

          <span
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant/40 cursor-not-allowed"
            title="Phase 5 (Analytics)"
          >
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            <span>Reports</span>
            <span className="text-[9px] bg-surface-container-high text-on-surface-variant px-1 rounded">v1.5</span>
          </span>

          {/* Owner Only Management Tabs */}
          {role === 'owner' && (
            <>
              <div className="w-px h-4 bg-outline-variant/40 mx-1" />
              <NavLink to="/users" className={navItemClass}>
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Users</span>
              </NavLink>
              <NavLink to="/settings" className={navItemClass}>
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Settings</span>
              </NavLink>
              <NavLink to="/audit" className={navItemClass}>
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Audit</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Right Header Status & User Controls */}
      <div className="flex items-center gap-3">
        {/* Telemetry Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Live Telemetry OK</span>
        </div>

        {/* User Profile Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-surface-container-low transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-on-surface leading-tight">{user?.fullName}</span>
              <div className="flex items-center gap-1">
                <Badge variant={role === 'owner' ? 'primary' : 'secondary'} className="text-[10px] px-1.5 py-0 scale-90 origin-left">
                  {role?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-surface-container">
                <p className="text-xs font-bold text-on-surface">{user?.fullName}</p>
                <p className="text-[11px] text-on-surface-variant font-mono">@{user?.username}</p>
              </div>

              {role === 'owner' && (
                <>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">settings</span>
                    <span>Pharmacy Settings</span>
                  </NavLink>
                  <NavLink
                    to="/users"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                    <span>Staff Management</span>
                  </NavLink>
                </>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/40 rounded-lg transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
