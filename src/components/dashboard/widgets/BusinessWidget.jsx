import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function BusinessWidget() {
  const businessMetrics = [
    { label: 'Umsatz (Monat)', value: '€45.230', change: '+12%', icon: DollarSign, positive: true },
    { label: 'Gewinn', value: '€12.450', change: '+8%', icon: TrendingUp, positive: true },
    { label: 'Mitarbeiter', value: '8', change: '+1', icon: Users, positive: true },
    { label: 'Projekte aktiv', value: '5', change: '0', icon: Briefcase, positive: null }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-light">Geschäftsübersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {businessMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-sm text-slate-600">{metric.label}</div>
                    <div className="text-lg font-light text-slate-900">{metric.value}</div>
                  </div>
                </div>
                <Badge variant={metric.positive ? 'default' : 'secondary'}>
                  {metric.change}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}