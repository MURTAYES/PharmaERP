import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';

export function AppLayout() {
  return (
    <div className="antialiased h-screen w-full flex text-[#002F34] bg-[#F3F7F6] overflow-hidden">
      {/* Left Sidebar - Sticky & Fixed */}
      <Sidebar />

      {/* Main Viewport Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Fixed & Sticky */}
        <Header />

        {/* Scrollable Center Body Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 sm:p-8 space-y-7 max-w-[1440px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
