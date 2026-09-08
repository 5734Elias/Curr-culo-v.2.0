import React from 'react';
import { clsx } from 'clsx';
import { CourseCategory } from '@/schemas/content';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyber' | 'indigo' | 'outline' | 'category';
  category?: CourseCategory;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'cyber',
  category,
  size = 'sm',
  ...props
}) => {
  const categoryStyles: Record<CourseCategory, string> = {
    desenvolvimento: 'bg-[rgba(0,242,255,0.1)] text-[#00f2ff] border-[#00f2ff]/30',
    dados: 'bg-[rgba(192,193,255,0.1)] text-[#c0c1ff] border-[#c0c1ff]/30',
    ia: 'bg-[rgba(255,246,228,0.1)] text-[#ffe173] border-[#ffe173]/30',
    cloud: 'bg-[rgba(116,245,255,0.1)] text-[#74f5ff] border-[#74f5ff]/30',
    seguranca: 'bg-[rgba(255,180,171,0.1)] text-[#ffb4ab] border-[#ffb4ab]/30',
    infraestrutura: 'bg-[rgba(185,202,203,0.1)] text-[#b9cacb] border-[#b9cacb]/30',
    outros: 'bg-[rgba(255,255,255,0.05)] text-[#dce4e4] border-[#849495]/30',
  };

  const variants = {
    cyber: 'bg-[rgba(0,242,255,0.12)] text-[#00f2ff] border border-[#00f2ff]/30',
    indigo: 'bg-[rgba(192,193,255,0.12)] text-[#c0c1ff] border border-[#c0c1ff]/30',
    outline: 'bg-transparent text-[#b9cacb] border border-[#3a494b]',
    category: category ? categoryStyles[category] : 'bg-[rgba(0,242,255,0.1)] text-[#00f2ff] border-[#00f2ff]/30',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-mono tracking-wider uppercase',
    md: 'text-xs px-2.5 py-1 font-mono tracking-wider uppercase',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-[0.25rem] font-medium border border-solid transition-colors',
        category ? categoryStyles[category] : variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
