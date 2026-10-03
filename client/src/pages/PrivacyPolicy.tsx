import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F3F7F6] text-[#002F34] flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link to="/login" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="PharmaERP Logo" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
          <span className="text-xl font-black text-[#002F34] tracking-tight">PharmaERP</span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#002F34] text-white text-xs font-bold hover:bg-[#012428] transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Login</span>
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="max-w-4xl mx-auto w-full bg-white/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-10 border border-white shadow-xl my-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#D7F1B5] flex items-center justify-center text-[#002F34]">
            <span className="material-symbols-outlined text-[26px]">shield</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#002F34]">Privacy Policy</h1>
            <p className="text-xs font-semibold text-[#5F7D7A]">Last updated: October 2026 • PharmaERP Healthcare Cloud</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          <section className="p-4 rounded-2xl bg-[#F3F7F6]/70 border border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-[#002F34] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#00A887]">lock</span>
              1. Healthcare Data Protection & Confidentiality
            </h2>
            <p>
              PharmaERP is committed to maintaining the highest security and confidentiality standards for clinical records, patient prescriptions, and pharmacy transactions. All medical sales and stock records are encrypted at rest using industry-standard AES-256 and transmitted exclusively over TLS 1.3 HTTPS channels.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-[#F3F7F6]/70 border border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-[#002F34] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#00A887]">database</span>
              2. Information Collected & Access Controls
            </h2>
            <p className="mb-2">
              We collect and process essential operational data strictly necessary for pharmacy management:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Item master, batch numbers, manufacture & expiry dates, and unit conversions.</li>
              <li>Point-of-sale invoices, customer phone numbers (optional for receipt delivery), and payment logs.</li>
              <li>Role-based access logs with pharmacist vs. owner segregation to protect cost and margin data.</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-[#F3F7F6]/70 border border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-[#002F34] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#00A887]">history</span>
              3. Immutable Audit Trails
            </h2>
            <p>
              To prevent inventory discrepancies and comply with pharmaceutical dispensing regulations, all invoice voids, batch adjustments, returns, and price overrides are permanently logged with timestamps, user credentials, and machine IP addresses in an immutable audit ledger.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-[#F3F7F6]/70 border border-slate-100">
            <h2 className="text-sm sm:text-base font-black text-[#002F34] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#00A887]">support_agent</span>
              4. Contact the Data Protection Officer
            </h2>
            <p>
              For inquiries regarding data compliance, automated backups, or user access deletion requests, please reach out through our{' '}
              <Link to="/contact" className="text-[#002F34] font-bold underline hover:text-[#00A887]">
                Contact Support Desk
              </Link>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full flex items-center justify-between text-[11px] font-bold text-[#5F7D7A] py-4">
        <span>&copy; {new Date().getFullYear()} PharmaERP Suite. All rights reserved.</span>
        <div className="flex gap-4">
          <Link to="/contact" className="hover:text-[#002F34] transition-colors">Contact</Link>
          <Link to="/login" className="hover:text-[#002F34] transition-colors">Login</Link>
        </div>
      </footer>
    </div>
  );
}
