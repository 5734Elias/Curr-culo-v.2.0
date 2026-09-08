import React from 'react';
import { clsx } from 'clsx';
import { Badge } from './Badge';

export interface SectionHeaderProps {
  badge: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  description,
  className,
}) => {
  return (
    <div className={clsx('space-y-2 mb-10', className)}>
      <Badge variant="cyber" size="sm">
        [ {badge} ]
      </Badge>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dce4e4]">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[#b9cacb] max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
