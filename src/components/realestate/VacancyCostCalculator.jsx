import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';

export default function VacancyCostCalculator() {
  const { data: vacancyCosts } = useQuery({
    queryKey: ['vacancyCosts'],
    queryFn: async () => {
      const buildings = await base44.entities.Building.list(null, 100);
      const units = await base44.entities.Unit.list(null, 500);
      
      const vacant = units.filter(u => u.status === 'vacant');
      const totalLoss = vacant.reduce((sum, u) => sum + (u.rent || 0), 0);
      
      return {
        vacant_units: vacant.length,
        monthly_loss: totalLoss,
        annual_loss: totalLoss * 12,
        units: vacant.map(u => ({ name: u.name, loss: u.rent || 0 }))
      };
    }
  });

  if (!vacancyCosts) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Leerstandskosten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-orange-50 rounded text-center">
            <p className="text-xs">Leerstände</p>
            <Badge className="bg-orange-600 text-lg">{vacancyCosts.vacant_units}</Badge>
          </div>
          <div className="p-3 bg-red-50 rounded text-center">
            <p className="text-xs">Jährlicher Verlust</p>
            <Badge className="bg-red-600 text-lg">{vacancyCosts.annual_loss}€</Badge>
          </div>
        </div>
        <div className="space-y-1">
          {vacancyCosts.units.slice(0, 5).map((unit, idx) => (
            <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm">{unit.name}</span>
              <Badge variant="outline">-{unit.loss}€/Monat</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}