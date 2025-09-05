import React from 'react';
import { formatNumber } from '../../utils/formatters';

interface CardProps {
  title: string;
  value: string | number;
  color: 'violet' | 'blue' | 'emerald';
}

const colorClasses = {
    violet: 'border-violet-500',
    blue: 'border-blue-500',
    emerald: 'border-emerald-500',
}

export const Card: React.FC<CardProps> = ({ title, value, color }) => {
  // If the value is a string and contains letters (like units "s" or text "N/A"),
  // display it as is. Otherwise, format it as a number.
  const displayValue = (typeof value === 'string' && /[a-zA-Z]/.test(value))
    ? value
    : formatNumber(value);

  return (
    <div className={`bg-content-light dark:bg-content-dark p-6 rounded-xl shadow-lg border-l-4 ${colorClasses[color]}`}>
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h4>
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{displayValue}</p>
    </div>
  );
};
