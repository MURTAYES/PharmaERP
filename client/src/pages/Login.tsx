import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Input } from '../components/common/Input.tsx';
import { Button } from '../components/common/Button.tsx';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Ambient Glow Lights */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-9 shadow-2xl border border-slate-200/80 flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Hero Branding */}
        <div className="flex flex-col items-center text-center gap-3 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-[32px]">medical_services</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pharm<span className="text-teal-600">ERP</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Clinical Pharmacy POS & Inventory Suite
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            icon="person"
            type="text"
            placeholder="e.g. admin or pharmacist"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />

          <Input
            label="Password"
            icon="lock"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="mt-2 w-full py-3.5 text-sm font-extrabold shadow-md bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600"
          >
            Sign In to Terminal
          </Button>
        </form>

        {/* Demo Credentials Quick Switcher */}
        <div className="mt-7 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
          <span className="font-bold uppercase tracking-widest text-[10px] text-slate-400">
            Quick Fill Demo Accounts:
          </span>
          <div className="flex justify-center gap-2 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin123');
              }}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-lg transition-colors text-teal-800 font-bold cursor-pointer"
            >
              Owner: admin
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('pharmacist');
                setPassword('pharma123');
              }}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-lg transition-colors text-sky-800 font-bold cursor-pointer"
            >
              Pharmacist: pharmacist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
