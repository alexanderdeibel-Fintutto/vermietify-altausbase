import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function OperatingCostWizardStep4({ onNext, selected = [] }) {
  const [costs, setCosts] = useState(selected.length > 0 ? selected : [{ category: '', amount: '', date: '' }]);

  const addCost = () => {
    setCosts([...costs, { category: '', amount: '', date: '' }]);
  };

  const removeCost = (idx) => {
    setCosts(costs.filter((_, i) => i !== idx));
  };

  const updateCost = (idx, field, value) => {
    const updated = [...costs];
    updated[idx][field] = value;
    setCosts(updated);
    onNext(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Einzelne Kosten erfassen</h2>
        <p className="text-sm text-slate-600">Geben Sie die Kostenpositionen für diese Abrechnung ein</p>
      </div>

      <div className="space-y-3">
        {costs.map((cost, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Kostenart</Label>
                  <Input 
                    placeholder="z.B. Wasser" 
                    value={cost.category}
                    onChange={(e) => updateCost(idx, 'category', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Betrag (€)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    value={cost.amount}
                    onChange={(e) => updateCost(idx, 'amount', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Datum</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="date"
                      value={cost.date}
                      onChange={(e) => updateCost(idx, 'date', e.target.value)}
                    />
                    {costs.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeCost(idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={addCost} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Weitere Kostenposition hinzufügen
      </Button>
    </div>
  );
}