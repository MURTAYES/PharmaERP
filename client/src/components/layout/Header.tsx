import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';

export function Header() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Search Input Pill */}
      <div className="w-80 md:w-96 relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search medicines, batches, invoices..."
          className="w-full bg-[#F3F7F6] border-none text-xs rounded-full py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-[#002F34] text-[#002F34] placeholder-slate-400 transition-all font-medium"
        />
      </div>

      {/* Right Header Actions & User Profile */}
      <div className="flex items-center space-x-4 sm:space-x-5">
        {/* Currency / Timezone Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#F3F7F6] text-xs font-semibold text-slate-600">
          <span>BDT (৳)</span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-500">Asia/Dhaka</span>
        </div>

        {/* User Information with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 pl-2 sm:border-l border-slate-200 cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 ring-2 ring-emerald-100 flex items-center justify-center font-bold text-xs text-[#002F34]">
              {user?.fullName
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2) || 'RX'}
            </div>
            <div className="text-left text-xs leading-tight hidden sm:block">
              <p className="font-bold text-[#002F34]">{user?.fullName}</p>
              <p className="text-slate-400 text-[11px] font-mono">@{user?.username} ({role})</p>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 9l4-4 4 4m0 6l-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 text-left">
                <p className="text-xs font-bold text-[#002F34]">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono">Role: {role?.toUpperCase()}</p>
              </div>

              {role === 'owner' && (
                <>
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#002F34] hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <span>Pharmacy Settings</span>
                  </Link>
                  <Link
                    to="/users"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#002F34] hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <span>Staff Management</span>
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left w-full cursor-pointer"
              >
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Button: POS Billing */}
        <Link
          to="/pos"
          className="bg-[#002F34] hover:bg-[#064249] text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 shadow-sm transition-transform active:scale-95 select-none"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
          <span>Open POS (F2)</span>
        </Link>
      </div>
    </header>
  );
}
