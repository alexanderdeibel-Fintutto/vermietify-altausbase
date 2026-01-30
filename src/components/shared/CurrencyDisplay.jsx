import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function CurrencyDisplay({ 
  amount, 
  currency = 'EUR',
  showTrend = false,
  previousAmount,
  colorize = false,
  size = 'md'
}) {
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount);

  const trend = previousAmount !== undefined ? amount - previousAmount : null;
  const trendPercentage = previousAmount ? ((trend / previousAmount) * 100).toFixed(1) : null;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  const getColor = () => {
    if (!colorize) return '';
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`font-semibold ${sizeClasses[size]} ${getColor()}`}>
        {formatted}
      </span>
      
      {showTrend && trend !== null && trend !== 0 && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          trend > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendPercentage}%
        </span>
      )}
    </div>
  );
}