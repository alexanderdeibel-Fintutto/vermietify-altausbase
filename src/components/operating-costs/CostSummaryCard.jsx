import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../../utils/costHelpers';

export default function CostSummaryCard({ 
  label, 
  amount, 
  icon: Icon,
  variant = 'default' 
}) {
  const colors = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-orange-600',
    info: 'text-blue-600'
  };

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    info: 'text-blue-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColors[variant]}`} />}
          <span className={`text-2xl font-bold ${colors[variant]}`}>
            {formatCurrency(amount)}
          </span>
        </div>
        <p className="text-sm text-gray-600">{label}</p>
      </CardContent>
    </Card>
  );
}