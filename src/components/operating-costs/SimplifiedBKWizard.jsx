import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { BKWithNoCostsWarning } from '@/components/shared/PlausibilityWarnings';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProgressTracker from '@/components/shared/ProgressTracker';

const WIZARD_STEPS = [
  { 
    label: 'Objekt & Zeitraum', 
    description: 'Wählen Sie das Gebäude und den Abrechnungszeitraum' 
  },
  { 
    label: 'Kosten-Vorauswahl', 
    description: 'Automatisch vorausgewählte umlagefähige Kosten prüfen und anpassen' 
  },
  { 
    label: 'Prüfen & Korrigieren', 
    description: 'Zusammenfassung prüfen und bei Bedarf anpassen' 
  },
  { 
    label: 'Vorschau & Generieren', 
    description: 'Abrechnung erstellen und als Entwurf speichern' 
  }
];

export default function SimplifiedBKWizard({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedPeriodStart, setSelectedPeriodStart] = useState('');
  const [selectedPeriodEnd, setSelectedPeriodEnd] = useState('');
  const [selectedCosts, setSelectedCosts] = useState(new Set());

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    enabled: !!selectedBuilding
  });

  // Auto-select umlagefähige Kosten
  const relevantCosts = invoices.filter(inv => 
    inv.building_id === selectedBuilding &&
    inv.operating_cost_relevant &&
    inv.invoice_date >= selectedPeriodStart &&
    inv.invoice_date <= selectedPeriodEnd
  );

  const handleNext = () => {
    if (currentStep === 0) {
      if (!selectedBuilding || !selectedPeriodStart || !selectedPeriodEnd) {
        toast.error('Bitte alle Felder ausfüllen');
        return;
      }
      // Auto-select all relevant costs
      setSelectedCosts(new Set(relevantCosts.map(c => c.id)));
    }
    setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFinish = async () => {
    try {
      await base44.entities.OperatingCostStatement.create({
        building_id: selectedBuilding,
        period_start: selectedPeriodStart,
        period_end: selectedPeriodEnd,
        selected_invoice_ids: Array.from(selectedCosts),
        status: 'draft'
      });
      toast.success('BK-Abrechnung erstellt');
      onClose();
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Betriebskostenabrechnung erstellen</DialogTitle>
        </DialogHeader>

        <ProgressTracker steps={WIZARD_STEPS.map(s => s.label)} currentStep={currentStep} />
        
        {/* Step Description */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Schritt {currentStep + 1}:</span> {WIZARD_STEPS[currentStep].description}
          </p>
        </div>

        <div className="py-6">
          {/* Step 1: Objekt & Zeitraum */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Gebäude auswählen *</Label>
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gebäude wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Abrechnungszeitraum von *</Label>
                  <Input 
                    type="date" 
                    value={selectedPeriodStart}
                    onChange={(e) => setSelectedPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>bis *</Label>
                  <Input 
                    type="date" 
                    value={selectedPeriodEnd}
                    onChange={(e) => setSelectedPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Kosten-Vorauswahl */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {relevantCosts.length === 0 ? (
                <Card className="p-6 bg-amber-50 border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">Keine umlagefähigen Kosten gefunden</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Für den gewählten Zeitraum wurden keine Rechnungen mit "Umlagefähig" markiert gefunden.
                      </p>
                      <p className="text-sm text-amber-700 mt-2">
                        <strong>Lösung:</strong> Gehen Sie zu Rechnungen und kategorisieren Sie Ihre Kosten korrekt.
                      </p>
                    </div>
                    <Link to={createPageUrl('Invoices')} onClick={() => onClose()}>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        Zur Kategorisierung →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <>
                  <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">
                        <strong>{relevantCosts.length} umlagefähige Kosten</strong> automatisch vorausgewählt
                      </p>
                    </div>
                  </Card>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {relevantCosts.map(cost => (
                      <Card key={cost.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedCosts.has(cost.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedCosts);
                              if (checked) {
                                newSelected.add(cost.id);
                              } else {
                                newSelected.delete(cost.id);
                              }
                              setSelectedCosts(newSelected);
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{cost.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-slate-500">{cost.recipient}</p>
                              <Badge variant="outline" className="text-xs">
                                {cost.cost_category || 'Keine Kategorie'}
                              </Badge>
                            </div>
                          </div>
                          <p className="font-semibold">€{cost.amount?.toFixed(2)}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

            </div>
          )}

          {/* Step 3: Prüfen */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Bereit zur Erstellung</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedCosts.size} Kosten für {buildings.find(b => b.id === selectedBuilding)?.name}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold">Zusammenfassung</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Zeitraum:</p>
                    <p className="font-medium">{selectedPeriodStart} bis {selectedPeriodEnd}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Gesamtbetrag:</p>
                    <p className="font-medium">
                      €{relevantCosts
                        .filter(c => selectedCosts.has(c.id))
                        .reduce((sum, c) => sum + (c.amount || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Vorschau */}
          {currentStep === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Fertig zum Erstellen</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Die BK-Abrechnung wird als Entwurf gespeichert und kann später bearbeitet werden.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Abrechnung erstellen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}