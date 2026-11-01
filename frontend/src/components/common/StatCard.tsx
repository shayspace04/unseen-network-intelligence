import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'default' | 'healthy' | 'warning' | 'fault';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  trendType = 'neutral',
  icon: Icon,
  variant = 'default',
  className,
}) => {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    fault: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const trendColors = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    neutral: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-4 shadow-soft-sm hover:shadow-soft-md transition-shadow relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {value}
            </span>
            {subValue && (
              <span className="text-xs text-slate-500 font-normal">
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
            iconVariants[variant]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center space-x-2">
          <span
            className={cn(
              'text-[11px] font-medium font-mono px-1.5 py-0.5 rounded border',
              trendColors[trendType]
            )}
          >
            {trend}
          </span>
          <span className="text-[11px] text-slate-500">vs nominal baseline</span>
        </div>
      )}
    </div>
  );
};
