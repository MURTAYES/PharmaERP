import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';

export function Sidebar() {
  const { role } = useAuth();
  const isOwner = role === 'owner';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center justify-between px-4 py-2.5 rounded-full bg-[#002F34] text-white font-medium text-sm shadow-md transition-all'
      : 'flex items-center space-x-3 px-3.5 py-2.5 rounded-full text-slate-500 hover:text-[#002F34] hover:bg-slate-100/70 font-medium text-sm transition-colors';

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div className="space-y-7">
        {/* Brand Logo Header */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-9 h-9 rounded-full bg-[#002F34] flex items-center justify-center text-white shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-[#002F34]">Pharmacy</span>
        </div>

        {/* Navigation Menus */}
        <nav className="space-y-6">
          {/* Group: Main Menu */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Main Menu
            </h3>
            <ul className="space-y-1">
              <li>
                <NavLink to="/dashboard" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>Dashboard</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                    </>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink to="/inventory" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>Inventory</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Group: Leads / Sales */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Leads & Billing
            </h3>
            <ul className="space-y-1">
              <li>
                <NavLink to="/pos" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>POS Billing (F2)</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                    </>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink to="/invoices" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>Orders</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                    </>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink to="/returns" className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M16 15v-1a4 4 0 00-4-4H4m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>Returns</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Group: Comms / Administration */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Management
            </h3>
            <ul className="space-y-1">
              {isOwner && (
                <>
                  <li>
                    <NavLink to="/reports" className={linkClass}>
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                            <span>Reports</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/users" className={linkClass}>
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                            <span>Users</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/settings" className={linkClass}>
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>Settings</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/audit" className={linkClass}>
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                            <span>Audit Log</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
      </div>

      {/* Bottom Status Capsule */}
      <div className="mt-6 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#97D8D0] flex items-center justify-center text-[#002F34] font-bold text-xs">
          Rx
        </div>
        <div>
          <p className="text-xs font-semibold text-[#002F34]">Pharmacy ERP</p>
          <p className="text-[10px] text-slate-500">Atomic $gte Guard Active</p>
        </div>
      </div>
    </aside>
  );
}
