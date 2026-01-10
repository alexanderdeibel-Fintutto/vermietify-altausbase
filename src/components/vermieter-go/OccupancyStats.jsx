import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function OccupancyStats({ buildingId }) {
  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => base44.entities.Unit.filter(
      buildingId ? { building_id: buildingId } : {},
      null,
      100
    )
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' }, null, 100)
  });

  const occupiedUnits = units.filter(u => contracts.find(c => c.unit_id === u.id)).length;
  const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

  const data = [
    { name: 'Vermietet', value: occupiedUnits },
    { name: 'Leer', value: units.length - occupiedUnits }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="w-4 h-4" />
          Auslastung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-blue-600">{occupancyRate.toFixed(0)}%</p>
          <p className="text-sm text-slate-600">Auslastung</p>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
              <Cell fill="#10b981" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded">
            <p className="text-xs text-green-900">Vermietet</p>
            <p className="text-lg font-bold text-green-900">{occupiedUnits}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <p className="text-xs text-slate-600">Leer</p>
            <p className="text-lg font-bold text-slate-900">{units.length - occupiedUnits}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}