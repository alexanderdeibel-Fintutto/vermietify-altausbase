import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertCircle, Clock } from 'lucide-react';

export default function WarrantyTracker({ buildingId }) {
  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', buildingId],
    queryFn: () => base44.entities.Equipment.filter(
      buildingId ? { building_id: buildingId } : {},
      '-installation_date',
      50
    )
  });

  const itemsWithWarranty = equipment.filter(e => e.warranty_until);
  
  const warrantyStatus = itemsWithWarranty.map(item => {
    const expiryDate = new Date(item.warranty_until);
    const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
      ...item,
      daysUntilExpiry,
      isExpiring: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
      isExpired: daysUntilExpiry < 0
    };
  }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Gewährleistung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {warrantyStatus.slice(0, 5).map(item => (
          <div key={item.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-slate-600">{item.category}</p>
              </div>
              <Badge className={
                item.isExpired ? 'bg-red-100 text-red-800' :
                item.isExpiring ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }>
                {item.isExpired ? 'Abgelaufen' :
                 item.isExpiring ? `${item.daysUntilExpiry}d` :
                 new Date(item.warranty_until).toLocaleDateString('de-DE')}
              </Badge>
            </div>
          </div>
        ))}
        {warrantyStatus.length === 0 && (
          <p className="text-center text-slate-600 py-4">Keine Gewährleistungen</p>
        )}
      </CardContent>
    </Card>
  );
}