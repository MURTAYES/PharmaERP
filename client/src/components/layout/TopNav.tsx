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
    `flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold tracking-wide transition-all select-none ${
      isActive
        ? 'bg-primary text-white shadow-pill'
        : 'text-slate-600 hover:text-primary-700 hover:bg-white/80'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 h-18 bg-white/90 backdrop-blur-md z-40 border-b border-teal-100/70 shadow-sm px-4 md:px-8 flex items-center justify-between">
      {/* Brand & System Title */}
      <div className="flex items-center gap-7">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-pill group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">medical_services</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              Pharm<span className="text-primary">ERP</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary-700 mt-0.5">
              Clinical POS Suite
            </span>
          </div>
        </NavLink>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-teal-50/70 border border-teal-100/60 p-1.5 rounded-3xl">
          <NavLink to="/dashboard" className={navItemClass}>
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/inventory" className={navItemClass}>
            <span className="material-symbols-outlined text-[18px]">medication</span>
            <span>Inventory</span>
          </NavLink>

          <NavLink to="/pos" className={navItemClass}>
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>POS Billing</span>
            <kbd className="text-[9px] bg-white/25 text-inherit px-1.5 py-0.5 rounded-md font-mono font-extrabold">
              F2
            </kbd>
          </NavLink>

          <NavLink to="/invoices" className={navItemClass}>
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Invoices</span>
          </NavLink>

          <NavLink to="/returns" className={navItemClass}>
            <span className="material-symbols-outlined text-[18px]">assignment_return</span>
            <span>Returns</span>
          </NavLink>

          {/* Owner Only Management Tabs */}
          {role === 'owner' && (
            <>
              <div className="w-px h-5 bg-teal-200/60 mx-1" />
              <NavLink to="/reports" className={navItemClass}>
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                <span>Reports</span>
              </NavLink>
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
        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>System Live</span>
        </div>

        {/* User Profile Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 bg-teal-50/60 hover:bg-teal-100/60 border border-teal-100 rounded-2xl transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.fullName}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant={role === 'owner' ? 'primary' : 'secondary'}
                  className="text-[9px] px-1.5 py-0 scale-90 origin-left"
                >
                  {role?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl shadow-2xl border border-teal-100 p-2.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-extrabold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono">@{user?.username}</p>
              </div>

              {role === 'owner' && (
                <>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-primary-700 hover:bg-teal-50 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">settings</span>
                    <span>Pharmacy Settings</span>
                  </NavLink>
                  <NavLink
                    to="/users"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-primary-700 hover:bg-teal-50 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                    <span>Staff Management</span>
                  </NavLink>
                </>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-error hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
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
