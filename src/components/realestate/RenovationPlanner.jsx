import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { Wrench } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function RenovationPlanner() {
  const [items, setItems] = useState({
    kitchen: { selected: false, cost: 8000 },
    bathroom: { selected: false, cost: 5000 },
    flooring: { selected: false, cost: 3500 },
    painting: { selected: true, cost: 1200 }
  });

  const totalCost = Object.values(items)
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Renovierungsplaner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-6">
          {Object.entries(items).map(([key, item]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <VfCheckbox
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                checked={item.selected}
                onCheckedChange={(checked) => 
                  setItems({ ...items, [key]: { ...item, selected: checked } })
                }
              />
              <CurrencyDisplay amount={item.cost} className="font-semibold" />
            </div>
          ))}
        </div>

        <div className="p-4 bg-[var(--vf-primary-50)] rounded-lg">
          <div className="text-sm text-[var(--vf-primary-700)] mb-2">Gesamtkosten</div>
          <CurrencyDisplay amount={totalCost} className="text-3xl font-bold text-[var(--vf-primary-600)]" />
        </div>
      </CardContent>
    </Card>
  );
}