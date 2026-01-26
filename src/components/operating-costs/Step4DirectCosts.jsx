import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Step4DirectCosts({ data, onNext, onBack, onDataChange, onSaveDraft, isSaving }) {
  const [directCosts, setDirectCosts] = useState(data.directCosts || {});
  const [expandedCosts, setExpandedCosts] = useState(new Set());

  // Nur direkt zuzuordnende Kosten aus Step 3
  const directCostItems = Object.entries(data.costs || {})
    .filter(([_, costData]) => costData.distributionKey === 'direkt')
    .map(([id, costData]) => ({ id, ...costData }));

  const allItems = [...data.contracts, ...data.vacancies];

  const toggleExpanded = (costId) => {
    setExpandedCosts(prev => {
      const next = new Set(prev);
      next.has(costId) ? next.delete(costId) : next.add(costId);
      return next;
    });
  };

  const updateDirectCost = (costId, itemId, value) => {
    setDirectCosts(prev => ({
      ...prev,
      [costId]: {
        ...(prev[costId] || {}),
        [itemId]: parseFloat(value) || 0
      }
    }));
  };

  const getAllocatedTotal = (costId) => {
    return Object.values(directCosts[costId] || {}).reduce((sum, val) => sum + val, 0);
  };

  const isFullyAllocated = (costId, total) => {
    const allocated = getAllocatedTotal(costId);
    return Math.abs(allocated - total) < 0.01; // Toleranz für Rundungsfehler
  };

  const handleNext = () => {
    // Validierung: Alle direkten Kosten müssen vollständig zugewiesen sein
    for (const item of directCostItems) {
      if (!isFullyAllocated(item.id, item.total)) {
        toast.error(`Die Kosten "${item.costType.sub_category}" sind nicht vollständig zugewiesen`);
        return;
      }
    }

    onDataChange({ directCosts });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Direkte Kostenzuordnung</h2>
        <p className="text-gray-600">
          Ordnen Sie die direkt zuzuweisenden Kosten den einzelnen Mietern/Leerständen zu
        </p>
      </div>

      {directCostItems.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Keine direkt zuzuordnenden Kosten vorhanden. Sie können direkt fortfahren.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {directCostItems.map(item => {
            const allocated = getAllocatedTotal(item.id);
            const remaining = item.total - allocated;
            const isExpanded = expandedCosts.has(item.id);
            const fullyAllocated = isFullyAllocated(item.id, item.total);

            return (
              <Card key={item.id} className={fullyAllocated ? 'border-green-500' : 'border-orange-500'}>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.costType.sub_category}</p>
                        {fullyAllocated ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>Gesamt: {item.total.toFixed(2)} €</span>
                        <span>Zugewiesen: {allocated.toFixed(2)} €</span>
                        <span className={remaining > 0.01 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                          Verbleibend: {remaining.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t">
                    {allItems.map(contract => {
                      const itemKey = contract.is_vacancy 
                        ? `vacancy-${contract.unit_id}-${contract.vacancy_start}` 
                        : contract.id;
                      const currentValue = directCosts[item.id]?.[itemKey] || 0;

                      return (
                        <div key={itemKey} className="flex items-center gap-3 py-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {contract.is_vacancy ? (
                                <>Leerstand - Einheit {contract.unit_id}</>
                              ) : (
                                <>Mietvertrag - {contract.tenant_id}</>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(contract.effective_start || contract.vacancy_start).toLocaleDateString('de-DE')} - 
                              {new Date(contract.effective_end || contract.vacancy_end).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <div className="w-32">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={currentValue || ''}
                              onChange={(e) => updateDirectCost(item.id, itemKey, e.target.value)}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">€</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Zurück
          </Button>
          <Button variant="outline" onClick={onSaveDraft} disabled={isSaving}>
            {isSaving ? 'Speichert...' : 'Entwurf speichern'}
          </Button>
        </div>
        <Button onClick={handleNext} className="bg-blue-900">
          Weiter zur Zusammenfassung
        </Button>
      </div>
    </div>
  );
}