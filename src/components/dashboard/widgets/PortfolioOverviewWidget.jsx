import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function PortfolioOverviewWidget() {
  const stats = [
    { label: 'Immobilien', value: '12', change: '+2' },
    { label: 'Vermietete Einheiten', value: '28', change: '+1' },
    { label: 'Leerstand', value: '2', change: '-1' },
    { label: 'Gesamtvermögen', value: '€3,2M', change: '+5%' }
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Portfolio-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className="text-xl font-light text-slate-900">{stat.value}</p>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}