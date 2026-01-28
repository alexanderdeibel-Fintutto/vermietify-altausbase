import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Step3CostSelection({ data, onNext, onBack, onDataChange, onSaveDraft, isSaving }) {
  const [selectedCosts, setSelectedCosts] = useState(data.costs || {});
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const { data: costTypes = [] } = useQuery({
    queryKey: ['costTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('CostType')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Invoice')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Nur umlagefähige Kostenarten
  const distributableCostTypes = costTypes.filter(ct => ct.distributable);

  // Nach Hauptkategorie gruppieren
  const groupedCostTypes = distributableCostTypes.reduce((acc, ct) => {
    const category = ct.main_category || 'Sonstige';
    if (!acc[category]) acc[category] = [];
    acc[category].push(ct);
    return acc;
  }, {});

  // Rechnungen filtern
  const getInvoicesForCostType = (costTypeId) => {
    return invoices.filter(inv => 
      inv.cost_type_id === costTypeId &&
      inv.building_id === data.building_id &&
      inv.invoice_date >= data.period_start &&
      inv.invoice_date <= data.period_end
    );
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const toggleCostType = (costType) => {
    setSelectedCosts(prev => {
      const next = { ...prev };
      if (next[costType.id]) {
        delete next[costType.id];
      } else {
        const relatedInvoices = getInvoicesForCostType(costType.id);
        next[costType.id] = {
          costType,
          selected: true,
          distributionKey: costType.distribution_key || 'Flaeche',
          selectedInvoices: relatedInvoices.map(inv => inv.id),
          total: relatedInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
          manualEntries: []
        };
      }
      return next;
    });
  };

  const updateDistributionKey = (costTypeId, key) => {
    setSelectedCosts(prev => ({
      ...prev,
      [costTypeId]: { ...prev[costTypeId], distributionKey: key }
    }));
  };

  const addManualEntry = (costTypeId) => {
    setSelectedCosts(prev => ({
      ...prev,
      [costTypeId]: {
        ...prev[costTypeId],
        manualEntries: [
          ...(prev[costTypeId].manualEntries || []),
          { description: '', amount: 0, date: data.period_start }
        ]
      }
    }));
  };

  const updateManualEntry = (costTypeId, idx, field, value) => {
    setSelectedCosts(prev => {
      const entries = [...prev[costTypeId].manualEntries];
      entries[idx] = { ...entries[idx], [field]: value };
      
      // Total neu berechnen
      const invoiceTotal = getInvoicesForCostType(costTypeId)
        .filter(inv => prev[costTypeId].selectedInvoices.includes(inv.id))
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const manualTotal = entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      return {
        ...prev,
        [costTypeId]: {
          ...prev[costTypeId],
          manualEntries: entries,
          total: invoiceTotal + manualTotal
        }
      };
    });
  };

  const handleNext = () => {
    const selectedCount = Object.keys(selectedCosts).length;
    if (selectedCount === 0) {
      toast.error('Bitte wählen Sie mindestens eine Kostenart aus');
      return;
    }

    onDataChange({ costs: selectedCosts });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Kosten erfassen</h2>
        <p className="text-gray-600">Wählen Sie die umlagefähigen Kostenarten und deren Verteilschlüssel</p>
      </div>

      {/* Kostenarten nach Kategorie */}
      {Object.entries(groupedCostTypes).map(([category, costTypesInCategory]) => (
        <div key={category} className="space-y-2">
          <h3 className="font-semibold text-gray-700 uppercase text-sm">{category}</h3>
          
          {costTypesInCategory.map(costType => {
            const isSelected = !!selectedCosts[costType.id];
            const isExpanded = expandedCategories.has(costType.id);
            const relatedInvoices = getInvoicesForCostType(costType.id);
            const totalAmount = selectedCosts[costType.id]?.total || 0;

            return (
              <Card key={costType.id} className={isSelected ? 'border-blue-900' : ''}>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => !isExpanded && toggleCostType(costType)}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCostType(costType);
                      }}
                    />
                    
                    <div className="flex-1">
                      <p className="font-medium">{costType.sub_category}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        {relatedInvoices.length > 0 && (
                          <span>{relatedInvoices.length} Buchungen • {totalAmount.toFixed(2)} €</span>
                        )}
                        {costType.betrkv_paragraph && (
                          <Badge variant="outline">{costType.betrkv_paragraph}</Badge>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-48" onClick={(e) => e.stopPropagation()}>
                        <Label className="text-xs">Verteilschlüssel</Label>
                        <Select 
                          value={selectedCosts[costType.id].distributionKey}
                          onValueChange={(val) => updateDistributionKey(costType.id, val)}
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

                    {isSelected && relatedInvoices.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(costType.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>

                  {/* Expandierte Buchungen */}
                  {isSelected && isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {relatedInvoices.map(invoice => (
                        <div key={invoice.id} className="flex items-center gap-3 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="flex-1">{invoice.description}</span>
                          <span className="text-gray-600">{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
                          <span className="font-medium">{invoice.amount?.toFixed(2)} €</span>
                        </div>
                      ))}

                      {/* Manuelle Einträge */}
                      {selectedCosts[costType.id]?.manualEntries?.map((entry, idx) => (
                        <div key={`manual-${idx}`} className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Beschreibung"
                            value={entry.description}
                            onChange={(e) => updateManualEntry(costType.id, idx, 'description', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Betrag"
                            value={entry.amount || ''}
                            onChange={(e) => updateManualEntry(costType.id, idx, 'amount', e.target.value)}
                            className="w-32"
                          />
                          <Badge>Manuell</Badge>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addManualEntry(costType.id)}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Manuelle Buchung
                      </Button>

                      <div className="pt-2 border-t mt-2 font-semibold text-sm">
                        Summe: {totalAmount.toFixed(2)} €
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      {/* Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Ausgewählte Kostenarten:</span>
          <span className="text-2xl font-bold text-blue-900">
            {Object.values(selectedCosts).reduce((sum, c) => sum + c.total, 0).toFixed(2)} €
          </span>
        </div>
      </Card>

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
          Weiter
        </Button>
      </div>
    </div>
  );
}