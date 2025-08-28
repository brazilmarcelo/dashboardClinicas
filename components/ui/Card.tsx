
import React from 'react';

interface CardProps {
  title: string;
  value: string;
  color: 'violet' | 'blue' | 'emerald';
}

const colorClasses = {
    violet: 'border-violet-500',
    blue: 'border-blue-500',
    emerald: 'border-emerald-500',
}

export const Card: React.FC<CardProps> = ({ title, value, color }) => {
  return (
    <div className={`bg-content-light dark:bg-content-dark p-6 rounded-xl shadow-lg border-l-4 ${colorClasses[color]}`}>
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h4>
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
};
