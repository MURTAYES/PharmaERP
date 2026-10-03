import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98] select-none';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-600 text-on-primary shadow-pill hover:shadow-float focus:ring-primary',
    secondary:
      'bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-200 focus:ring-primary',
    outline:
      'border border-slate-200 bg-white text-slate-800 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 shadow-sm focus:ring-primary',
    danger:
      'bg-error hover:bg-red-600 text-white shadow-sm hover:shadow-md focus:ring-error',
    ghost:
      'text-slate-600 hover:text-primary-700 hover:bg-primary-50 focus:ring-primary',
  };

  const sizes = {
    sm: 'h-8 px-3.5 text-xs gap-1.5 rounded-xl',
    md: 'h-10 px-5 text-xs tracking-wide gap-2 rounded-2xl',
    lg: 'h-12 px-7 text-sm tracking-wide gap-2.5 rounded-2xl font-extrabold',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
