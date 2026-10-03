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
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background mint circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-fixed/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-8 sm:p-10 shadow-clinical border border-outline-variant/30 flex flex-col z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-clinical-glow">
            <span className="material-symbols-outlined text-[32px]">medical_services</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">PharmERP</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mt-0.5">
              Clinical Pharmacy Management
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">error</span>
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

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2 w-full">
            Sign In to Terminal
          </Button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-surface-container flex flex-col gap-2 text-center text-xs text-on-surface-variant">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Default Credentials</span>
          <div className="flex justify-center gap-4 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin123');
              }}
              className="px-2 py-1 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors text-primary"
            >
              Owner: admin / admin123
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('pharmacist');
                setPassword('pharma123');
              }}
              className="px-2 py-1 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors text-secondary"
            >
              Staff: pharmacist / pharma123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
