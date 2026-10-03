import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  icon,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full h-11 px-4 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-transparent focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
              icon && 'pl-10',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-error font-medium">{error}</span>}
      {helperText && !error && <span className="text-xs text-on-surface-variant">{helperText}</span>}
    </div>
  );
}
