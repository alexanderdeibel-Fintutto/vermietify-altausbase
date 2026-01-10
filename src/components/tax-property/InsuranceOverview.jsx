import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle } from 'lucide-react';

export default function InsuranceOverview() {
  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances'],
    queryFn: () => base44.entities.Insurance.list('-expiry_date', 50)
  });

  const totalPremium = insurances.reduce((sum, i) => sum + (i.annual_premium || 0), 0);
  
  const expiringInsurances = insurances.filter(ins => {
    if (!ins.expiry_date) return false;
    const days = Math.floor((new Date(ins.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Versicherungen
          </CardTitle>
          {expiringInsurances.length > 0 && (
            <Badge className="bg-orange-600">
              {expiringInsurances.length} laufen aus
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">Jahresprämien gesamt</p>
          <p className="text-2xl font-bold text-blue-900">{totalPremium.toLocaleString('de-DE')} €</p>
        </div>

        <div className="space-y-2">
          {insurances.slice(0, 5).map(ins => {
            const days = ins.expiry_date 
              ? Math.floor((new Date(ins.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiring = days && days <= 90;
            
            return (
              <div key={ins.id} className={`p-2 rounded ${isExpiring ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{ins.insurance_type}</p>
                    <p className="text-xs text-slate-600">{ins.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{ins.annual_premium} €/Jahr</p>
                    {isExpiring && (
                      <Badge className="bg-orange-600 text-xs mt-1">
                        {days} Tage
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}