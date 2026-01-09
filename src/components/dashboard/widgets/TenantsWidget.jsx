import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, DollarSign, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function TenantsWidget() {
  const tenantStats = [
    { label: 'Aktive Mieter', value: '24', icon: Users, color: 'text-blue-600' },
    { label: 'Vermietete Einheiten', value: '28', icon: Home, color: 'text-green-600' },
    { label: 'Monatliche Miete', value: '€18.500', icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Verspätete Zahlungen', value: '2', icon: AlertCircle, color: 'text-red-600' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-light">Mieterverwaltung</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {tenantStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-slate-600">{stat.label}</span>
                </div>
                <div className="text-lg font-extralight text-slate-900">{stat.value}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}