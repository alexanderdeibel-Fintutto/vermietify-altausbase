import React from 'react';
import { cn } from '@/lib/utils';

export default function CurrencyDisplay({ 
  amount, 
  currency = 'EUR',
  showSign = true,
  colored = false,
  className 
}) {
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency
  }).format(amount);

  return (
    <span className={cn(
      "font-variant-numeric-tabular-nums",
      colored && amount > 0 && "text-[var(--vf-success-600)]",
      colored && amount < 0 && "text-[var(--vf-error-600)]",
      className
    )}>
      {showSign && amount > 0 && '+'}
      {formatted}
    </span>
  );
}