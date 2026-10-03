import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';

export function AppLayout() {
  return (
    <div className="antialiased min-h-screen flex text-[#002F34] bg-[#F3F7F6]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <div className="p-6 sm:p-8 space-y-7 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
