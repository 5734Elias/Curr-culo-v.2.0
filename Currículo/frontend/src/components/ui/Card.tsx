import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surfaceTier?: 'informative' | 'featured' | 'interactive';
  hoverEffect?: boolean;
  activeGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  surfaceTier = 'featured',
  hoverEffect = false,
  activeGlow = false,
  ...props
}) => {
  const tierClasses = {
    informative: 'surface-tier-1 rounded-[0.25rem] p-6 relative overflow-hidden text-[#dce4e4]',
    featured: 'surface-tier-2 rounded-[0.25rem] p-6 relative overflow-hidden text-[#dce4e4]',
    interactive: 'surface-tier-3 rounded-[0.25rem] p-6 relative overflow-hidden text-[#dce4e4]',
  };

  return (
    <div
      className={clsx(
        tierClasses[surfaceTier],
        hoverEffect && 'glass-panel-hover cursor-pointer',
        activeGlow && 'border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.25)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={clsx('pb-4 mb-4 border-b border-[#3a494b]/60', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={clsx('text-lg font-semibold text-[#dce4e4] tracking-tight flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={clsx('text-xs text-[#b9cacb] mt-1 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return <div className={clsx('space-y-4', className)} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('pt-4 mt-6 border-t border-[#3a494b]/60 flex items-center justify-between gap-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};
