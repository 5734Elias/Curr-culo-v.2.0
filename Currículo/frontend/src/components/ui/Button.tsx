import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[0.25rem] focus-visible:outline-2 focus-visible:outline-[#00f2ff] focus-visible:outline-offset-3 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary:
        'bg-[#00f2ff] text-[#00363a] hover:bg-[#74f5ff] hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] active:bg-[#00dbe7] font-semibold',
      secondary:
        'bg-[#3131c0] text-[#ffffff] hover:bg-[#2f2ebe] hover:shadow-[0_0_15px_rgba(192,193,255,0.3)] active:bg-[#1000a9]',
      outline:
        'border border-[#00f2ff] text-[#00f2ff] bg-transparent hover:bg-[rgba(0,242,255,0.1)] hover:shadow-[0_0_12px_rgba(0,242,255,0.2)]',
      ghost:
        'bg-transparent text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[rgba(255,255,255,0.05)]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px] sm:min-h-[32px]',
      md: 'text-sm px-4 py-2 gap-2 min-h-[44px]',
      lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
