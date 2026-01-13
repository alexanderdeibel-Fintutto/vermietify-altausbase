import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HelpTooltip from "@/components/shared/HelpTooltip";

export default function OperatingCostWizardStep3({ onNext, selected }) {
  const { data: costTypes = [] } = useQuery({
    queryKey: ['cost-types'],
    queryFn: () => base44.entities.CostType.list()
  });

  const distributableCosts = costTypes.filter(ct => ct.distributable);

  const toggleCost = (costId) => {
    const updated = selected.some(s => s === costId)
      ? selected.filter(s => s !== costId)
      : [...selected, costId];
    onNext(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Umlagefähige Kosten</h2>
          <HelpTooltip text="Nur Kosten, die vertraglich umlägbar sind, werden hier angezeigt (BetrKV §556 BGB)." />
        </div>
        <p className="text-sm text-slate-600">Welche Kostenarten sollen auf die Mieter umgelegt werden?</p>
      </div>

      <div className="grid gap-2">
        {distributableCosts.map(cost => (
          <Card 
            key={cost.id}
            className="cursor-pointer hover:bg-slate-50"
            onClick={() => toggleCost(cost.id)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <Checkbox checked={selected.includes(cost.id)} readOnly />
              <div className="flex-1">
                <p className="font-medium text-sm">{cost.main_category}</p>
                <p className="text-xs text-slate-500">{cost.sub_category}</p>
              </div>
              <span className="text-xs text-slate-400">{cost.distribution_key || 'qm'}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {distributableCosts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Keine umlagefähigen Kostenarten definiert.
        </div>
      )}
    </div>
  );
}