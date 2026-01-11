import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, AlertCircle } from 'lucide-react';

export default function EnergyPassportManager({ companyId }) {
  const { data: passports = [] } = useQuery({
    queryKey: ['energy-passports', companyId],
    queryFn: () => base44.asServiceRole.entities.EnergyPassport.filter({ company_id: companyId })
  });

  const getClassColor = (energyClass) => {
    const colors = {
      'A+': 'bg-green-600 text-white',
      'A': 'bg-green-500 text-white',
      'B': 'bg-lime-500 text-white',
      'C': 'bg-yellow-500 text-white',
      'D': 'bg-orange-500 text-white',
      'E': 'bg-red-500 text-white',
      'F': 'bg-red-600 text-white',
      'G': 'bg-red-700 text-white',
      'H': 'bg-red-800 text-white'
    };
    return colors[energyClass] || 'bg-slate-500 text-white';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="w-4 h-4" />
          Energieausweise (GEG)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {passports.map(passport => {
          const daysToExpiry = Math.floor((new Date(passport.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
          const isExpiring = daysToExpiry < 90;

          return (
            <div key={passport.id} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{passport.passport_type}</span>
                <Badge className={getClassColor(passport.energy_class)}>
                  Klasse {passport.energy_class}
                </Badge>
              </div>
              <div className="text-xs space-y-1 mb-2">
                <p>Verbrauch: {passport.energy_consumption_kwh} kWh/m²a</p>
                <p>Gültig bis: {passport.expiry_date}</p>
                {isExpiring && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Läuft in {daysToExpiry} Tagen ab!</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}