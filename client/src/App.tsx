import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { Login } from './pages/Login.tsx';
import { PrivacyPolicy } from './pages/PrivacyPolicy.tsx';
import { Contact } from './pages/Contact.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Users } from './pages/Users.tsx';
import { Settings } from './pages/Settings.tsx';
import { AuditLogs } from './pages/AuditLogs.tsx';
import { Inventory } from './pages/Inventory.tsx';
import { POS } from './pages/POS.tsx';
import { Invoices } from './pages/Invoices.tsx';
import { Returns } from './pages/Returns.tsx';
import { Reports } from './pages/Reports.tsx';

export function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<Contact />} />

      {/* Protected Routes for Authenticated Users */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/returns" element={<Returns />} />

          {/* Owner Only Management Routes */}
          <Route element={<ProtectedRoute requiredRole="owner" />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit" element={<AuditLogs />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
