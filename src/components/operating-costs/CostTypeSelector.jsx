import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function CostTypeSelector({ 
  costType, 
  isSelected, 
  distributionKey,
  totalAmount = 0,
  onToggle, 
  onDistributionChange 
}) {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-colors ${
        isSelected ? 'border-blue-900 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => !isSelected && onToggle()}
    >
      <div className="flex items-center gap-4">
        <Checkbox 
          checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
        
        <div className="flex-1">
          <p className="font-medium">{costType.sub_category || costType.name}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            {totalAmount > 0 && <span>{totalAmount.toFixed(2)} €</span>}
            {costType.betrkv_paragraph && (
              <Badge variant="outline">{costType.betrkv_paragraph}</Badge>
            )}
          </div>
        </div>

        {isSelected && (
          <div className="w-48" onClick={(e) => e.stopPropagation()}>
            <Label className="text-xs">Verteilschlüssel</Label>
            <Select 
              value={distributionKey}
              onValueChange={onDistributionChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Flaeche">Wohnfläche (qm)</SelectItem>
                <SelectItem value="Personen">Personenanzahl</SelectItem>
                <SelectItem value="Einheiten">Wohneinheiten</SelectItem>
                <SelectItem value="HeizkostenV">HeizkostenV (70/30)</SelectItem>
                <SelectItem value="direkt">Direkt zuordnen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
}