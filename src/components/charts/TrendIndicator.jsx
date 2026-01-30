import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

export default function TrendIndicator({ value, previousValue, format = 'percentage', compact = false }) {
  if (previousValue === undefined || previousValue === null) {
    return null;
  }

  const change = value - previousValue;
  const percentChange = previousValue !== 0 ? ((change / previousValue) * 100) : 0;
  
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const ArrowIcon = isPositive ? ArrowUp : ArrowDown;

  const colorClass = isPositive
    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
    : isNegative
    ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
    : 'text-gray-600 bg-gray-50 dark:bg-gray-800';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        <ArrowIcon className="w-3 h-3" />
        <span>{Math.abs(percentChange).toFixed(1)}%</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass}`}>
      <Icon className="w-4 h-4" />
      <div>
        <span className="text-sm font-semibold">
          {format === 'percentage' 
            ? `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`
            : `${isPositive ? '+' : ''}${change.toFixed(2)}`
          }
        </span>
        {!compact && (
          <span className="text-xs ml-2 opacity-75">
            vs. vorher
          </span>
        )}
      </div>
    </div>
  );
}