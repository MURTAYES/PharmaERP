import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: string; // Material symbols icon name
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
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-container shadow-sm focus:ring-primary',
    secondary:
      'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim focus:ring-secondary',
    outline:
      'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low focus:ring-primary shadow-sm',
    danger:
      'bg-error text-on-error hover:bg-red-700 focus:ring-error shadow-sm',
    ghost:
      'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low focus:ring-primary',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
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
