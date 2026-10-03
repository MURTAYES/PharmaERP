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
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 text-primary text-[20px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full h-11 px-4 bg-white rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs',
              icon && 'pl-11',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-error font-semibold">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-slate-500 font-medium">{helperText}</span>}
    </div>
  );
}
