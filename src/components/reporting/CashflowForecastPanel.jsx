import React from 'react';
import CashflowForecast from '@/components/finance/CashflowForecast';

export default function CashflowForecastPanel({ months = 6 }) {
  return <CashflowForecast months={months} />;
}