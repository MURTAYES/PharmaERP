import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ children, className, hoverEffect = false, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface-container-lowest rounded-2xl p-6 shadow-clinical border border-outline-variant/30',
          hoverEffect && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
