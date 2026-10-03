import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide';

  const variants = {
    primary: 'bg-primary-container/15 text-primary',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-900',
    error: 'bg-error-container text-on-error-container',
    neutral: 'bg-surface-container-high text-on-surface-variant',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-error',
    neutral: 'bg-on-surface-variant',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
