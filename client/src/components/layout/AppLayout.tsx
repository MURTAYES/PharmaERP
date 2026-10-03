import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav.tsx';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased relative overflow-x-hidden">
      {/* Ambient Mint Glow Backdrops */}
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-96 -left-24 w-96 h-96 bg-primary-fixed/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <TopNav />

      {/* Main Page Body */}
      <main className="w-full pt-16 flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
