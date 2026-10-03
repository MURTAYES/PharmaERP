import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-5 gap-6 my-6">
        {/* Contact Info Sidebar */}
        <div className="md:col-span-2 bg-[#002F34] text-white rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#97D8D0]/20 flex items-center justify-center text-[#97D8D0] mb-6">
              <span className="material-symbols-outlined text-[26px]">support_agent</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Get in Touch</h1>
            <p className="text-xs text-slate-300 font-medium mb-8">
              Need technical support, system deployment, or thermal printer setup assistance? We're here to help.
            </p>

            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#97D8D0]">mail</span>
                <div>
                  <div className="font-bold text-white">Email Support</div>
                  <div className="text-slate-300">support@pharmaerp.local</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#D7F1B5]">call</span>
                <div>
                  <div className="font-bold text-white">Helpdesk Hotline</div>
                  <div className="text-slate-300">+880 1700-000000</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#F1B5B9]">schedule</span>
                <div>
                  <div className="font-bold text-white">Support Hours</div>
                  <div className="text-slate-300">Mon - Sat: 9:00 AM - 10:00 PM (Asia/Dhaka)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-300">
            Emergency POS & Database assistance available 24/7 for registered pharmacy owners.
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="md:col-span-3 bg-white/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white shadow-xl flex flex-col justify-center">
          {submitted ? (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#D7F1B5] text-[#002F34] flex items-center justify-center">
                <span className="material-symbols-outlined text-[30px]">check_circle</span>
              </div>
              <h3 className="text-xl font-black text-[#002F34]">Message Received</h3>
              <p className="text-xs font-medium text-slate-600 max-w-xs">
                Thank you for reaching out. Our support team will respond to your inquiry promptly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-5 py-2.5 rounded-full bg-[#002F34] text-white text-xs font-bold hover:bg-[#012428] transition-all cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-[#002F34]">Send Us a Message</h2>
                <p className="text-xs text-[#5F7D7A] font-medium">Fill out the form below and our team will get back to you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#5F7D7A]">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 px-3.5 bg-[#F3F7F6] focus:bg-white rounded-2xl text-xs font-bold text-[#002F34] placeholder:text-slate-400 placeholder:font-normal border-2 border-transparent focus:border-[#002F34] transition-all outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#5F7D7A]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@pharmacy.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 px-3.5 bg-[#F3F7F6] focus:bg-white rounded-2xl text-xs font-bold text-[#002F34] placeholder:text-slate-400 placeholder:font-normal border-2 border-transparent focus:border-[#002F34] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#5F7D7A]">Subject / Pharmacy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medico Care Pharmacy - Integration Assistance"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="h-11 px-3.5 bg-[#F3F7F6] focus:bg-white rounded-2xl text-xs font-bold text-[#002F34] placeholder:text-slate-400 placeholder:font-normal border-2 border-transparent focus:border-[#002F34] transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#5F7D7A]">Message Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your inquiry or support requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="p-3 bg-[#F3F7F6] focus:bg-white rounded-2xl text-xs font-bold text-[#002F34] placeholder:text-slate-400 placeholder:font-normal border-2 border-transparent focus:border-[#002F34] transition-all outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="mt-1 w-full h-11 bg-[#002F34] hover:bg-[#012428] text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Submit Inquiry</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full flex items-center justify-between text-[11px] font-bold text-[#5F7D7A] py-4">
        <span>&copy; {new Date().getFullYear()} PharmaERP Suite. All rights reserved.</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-[#002F34] transition-colors">Privacy Policy</Link>
          <Link to="/login" className="hover:text-[#002F34] transition-colors">Login</Link>
        </div>
      </footer>
    </div>
  );
}
