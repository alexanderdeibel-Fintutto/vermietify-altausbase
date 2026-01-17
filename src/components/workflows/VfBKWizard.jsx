import React, { useState } from 'react';
import { VfWizard } from '@/components/workflows/VfWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VfCombobox } from '@/components/ui/vf-combobox';
import { Upload } from 'lucide-react';

export function VfBKWizard({ buildingId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    building_id: buildingId || '',
    period_start: '',
    period_end: '',
    costs: [],
    distributions: {}
  });

  const steps = [
    { id: 'building', label: 'Objekt', title: 'Objekt auswählen', description: 'Wählen Sie das abzurechnende Objekt' },
    { id: 'period', label: 'Zeitraum', title: 'Abrechnungszeitraum', description: 'Definieren Sie den Zeitraum' },
    { id: 'costs', label: 'Kosten', title: 'Kosten erfassen', description: 'Erfassen Sie alle umlagefähigen Kosten' },
    { id: 'distribution', label: 'Verteilung', title: 'Verteilerschlüssel', description: 'Definieren Sie die Umlageschlüssel' },
    { id: 'calculate', label: 'Berechnung', title: 'Berechnung', description: 'Prüfen Sie die Abrechnung' },
    { id: 'preview', label: 'Vorschau', title: 'Vorschau', description: 'Finales Dokument prüfen' },
    { id: 'send', label: 'Versand', title: 'Versenden', description: 'An Mieter versenden' }
  ];

  const costCategories = [
    { id: 'grundsteuer', label: 'Grundsteuer', betrKV: '§2 Nr. 1' },
    { id: 'wasser', label: 'Wasserversorgung', betrKV: '§2 Nr. 2' },
    { id: 'abwasser', label: 'Entwässerung', betrKV: '§2 Nr. 3' },
    { id: 'heizung', label: 'Heizung', betrKV: '§2 Nr. 4a' },
    { id: 'warmwasser', label: 'Warmwasser', betrKV: '§2 Nr. 4b' },
    { id: 'aufzug', label: 'Aufzug', betrKV: '§2 Nr. 7' },
    { id: 'strassenreinigung', label: 'Straßenreinigung', betrKV: '§2 Nr. 8' },
    { id: 'muellabfuhr', label: 'Müllabfuhr', betrKV: '§2 Nr. 8' },
    { id: 'hausreinigung', label: 'Hausreinigung', betrKV: '§2 Nr. 9' },
    { id: 'gartenpflege', label: 'Gartenpflege', betrKV: '§2 Nr. 10' },
    { id: 'beleuchtung', label: 'Beleuchtung', betrKV: '§2 Nr. 11' },
    { id: 'schornsteinfeger', label: 'Schornsteinfeger', betrKV: '§2 Nr. 12' },
    { id: 'versicherung', label: 'Versicherungen', betrKV: '§2 Nr. 13' },
    { id: 'hauswart', label: 'Hauswart', betrKV: '§2 Nr. 14' },
    { id: 'antenne', label: 'Antenne/Kabel', betrKV: '§2 Nr. 15' }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <VfWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        {currentStep === 2 && (
          <div>
            <table className="vf-cost-table">
              <thead>
                <tr>
                  <th>Kostenkategorie</th>
                  <th>Betrag</th>
                  <th>Schlüssel</th>
                  <th>Beleg</th>
                </tr>
              </thead>
              <tbody>
                {costCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="vf-cost-table__category">
                      <Checkbox />
                      <div>
                        <div>{category.label}</div>
                        <div className="text-xs text-[var(--theme-text-muted)]">{category.betrKV}</div>
                      </div>
                    </td>
                    <td className="vf-cost-table__amount">
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        className="w-32 text-right"
                      />
                    </td>
                    <td>
                      <Select defaultValue="flaeche">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flaeche">Fläche</SelectItem>
                          <SelectItem value="personen">Personen</SelectItem>
                          <SelectItem value="einheiten">Einheiten</SelectItem>
                          <SelectItem value="verbrauch">Verbrauch</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="vf-cost-table__belege">
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Beleg
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 p-4 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Gesamtkosten:</span>
                <span className="font-semibold">0,00 €</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Vorauszahlungen:</span>
                <span className="font-semibold">0,00 €</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-[var(--theme-border)] pt-2">
                <span>Differenz:</span>
                <span>0,00 €</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Abrechnung erstellt!</h3>
            <p className="text-[var(--theme-text-secondary)] mb-6">
              Die Betriebskostenabrechnung wurde erfolgreich erstellt und kann nun versendet werden.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline">PDF herunterladen</Button>
              <Button variant="gradient">An alle Mieter senden</Button>
            </div>
          </div>
        )}
      </VfWizard>
    </div>
  );
}