import React from 'react';

type CardColor = 'violet' | 'emerald' | 'rose' | 'amber' | 'sky';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: CardColor;
  badge?: string;
}

const colorMap: Record<CardColor, { icon: string; iconBg: string; border: string; badge: string }> = {
  violet: { icon: 'text-violet-500 dark:text-violet-400', iconBg: 'bg-violet-50 dark:bg-violet-500/10',  border: 'border-violet-200 dark:border-violet-500/20', badge: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300' },
  emerald: { icon: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  rose:   { icon: 'text-rose-500 dark:text-rose-400',   iconBg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-200 dark:border-rose-500/20',    badge: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' },
  amber:  { icon: 'text-amber-600 dark:text-amber-400',  iconBg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/20',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  sky:    { icon: 'text-sky-600 dark:text-sky-400',    iconBg: 'bg-sky-50 dark:bg-sky-500/10',      border: 'border-sky-200 dark:border-sky-500/20',      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
};

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, badge }) => {
  const c = colorMap[color];
  return (
    <div className={`bg-white dark:bg-content-dark rounded-2xl p-5 border ${c.border} flex flex-col gap-4 transition-all`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
          <span className={`${c.icon} w-5 h-5 block`}>{icon}</span>
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">{title}</p>
      </div>
    </div>
  );
};

export const Card = MetricCard;
