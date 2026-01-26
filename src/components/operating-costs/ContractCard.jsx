import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Home, Calendar } from 'lucide-react';
import { calculateDaysBetween, formatGermanDate } from '../../utils/dateHelpers';

export default function ContractCard({ 
  contract, 
  tenant, 
  unit, 
  onPersonCountChange,
  showPersonInput = true
}) {
  const days = calculateDaysBetween(
    contract.effective_start || contract.start_date,
    contract.effective_end || contract.end_date
  );

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <p className="font-medium">
              {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannter Mieter'}
            </p>
            <Badge variant="outline">
              <Home className="w-3 h-3 mr-1" />
              {unit?.unit_number}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-3 h-3" />
            {formatGermanDate(contract.effective_start || contract.start_date)} - 
            {formatGermanDate(contract.effective_end || contract.end_date)}
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {days} Tage • {unit?.wohnflaeche_qm} m²
          </p>
        </div>

        {showPersonInput && (
          <div className="w-32">
            <Label className="text-xs">Personen</Label>
            <Input
              type="number"
              min="1"
              value={contract.number_of_persons || 1}
              onChange={(e) => onPersonCountChange?.(contract.id, parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
        )}
      </div>
    </Card>
  );
}