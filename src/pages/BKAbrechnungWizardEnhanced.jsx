import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { VfInput } from '@/components/shared/VfInput';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowRight, X, Building, Calendar, Euro, Calculator, FileText, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function BKAbrechnungWizardEnhanced() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);
  const [data, setData] = useState({
    building_id: '',
    year: new Date().getFullYear() - 1,
    period_from: '',
    period_to: '',
    costs: [],
    selectedUnits: [],
    distribution: {}
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    const buildingsList = await base44.entities.Building.list();
    setBuildings(buildingsList);
  };

  useEffect(() => {
    if (data.building_id) {
      loadUnits(data.building_id);
    }
  }, [data.building_id]);

  const loadUnits = async (buildingId) => {
    const unitsList = await base44.entities.Unit.filter({ building_id: buildingId });
    setUnits(unitsList);
    setData(prev => ({ ...prev, selectedUnits: unitsList.map(u => u.id) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const statement = await base44.entities.OperatingCostStatement.create({
        building_id: data.building_id,
        abrechnungsjahr: data.year,
        zeitraum_von: data.period_from,
        zeitraum_bis: data.period_to,
        status: 'Entwurf',
        erstellungsdatum: new Date().toISOString().split('T')[0]
      });

      for (const cost of data.costs.filter(c => c.selected && c.amount > 0)) {
        await base44.entities.OperatingCostItem.create({
          statement_id: statement.id,
          kostenart: cost.id,
          bezeichnung: cost.label,
          betrkv_nummer: cost.betrKV,
          gesamtbetrag: parseFloat(cost.amount),
          verteilerschluessel: cost.distribution || 'Flaeche',
          verteilungsgrundlage_gesamt: cost.distributionBase || 100
        });
      }

      toast.success('Betriebskostenabrechnung erfolgreich erstellt!');
      navigate('/operating-costs');
    } catch (error) {
      toast.error('Fehler beim Erstellen der Abrechnung');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'building', title: 'Objekt' },
    { id: 'period', title: 'Zeitraum' },
    { id: 'costs', title: 'Kosten' },
    { id: 'distribution', title: 'Verteilung' },
    { id: 'preview', title: 'Vorschau' },
    { id: 'complete', title: 'Fertig' }
  ];

  const costCategories = [
    { id: 'Grundsteuer', label: 'Grundsteuer', betrKV: '§2 Nr. 1' },
    { id: 'Wasser', label: 'Wasserversorgung', betrKV: '§2 Nr. 2' },
    { id: 'Abwasser', label: 'Abwasserentsorgung', betrKV: '§2 Nr. 3' },
    { id: 'Heizung', label: 'Heizkosten', betrKV: '§2 Nr. 4' },
    { id: 'Warmwasser', label: 'Warmwasser', betrKV: '§2 Nr. 5' },
    { id: 'Aufzug', label: 'Aufzug', betrKV: '§2 Nr. 6' },
    { id: 'Strassenreinigung', label: 'Straßenreinigung', betrKV: '§2 Nr. 7' },
    { id: 'Muellabfuhr', label: 'Müllabfuhr', betrKV: '§2 Nr. 8' },
    { id: 'Gebaeudereinigung', label: 'Gebäudereinigung', betrKV: '§2 Nr. 9' },
    { id: 'Gartenpflege', label: 'Gartenpflege', betrKV: '§2 Nr. 10' },
    { id: 'Allgemeinstrom', label: 'Allgemeinstrom', betrKV: '§2 Nr. 11' },
    { id: 'Schornsteinfeger', label: 'Schornsteinfeger', betrKV: '§2 Nr. 12' },
    { id: 'Versicherung', label: 'Versicherungen', betrKV: '§2 Nr. 13' },
    { id: 'Hauswart', label: 'Hauswart', betrKV: '§2 Nr. 14' },
    { id: 'Sonstige', label: 'Sonstige Betriebskosten', betrKV: '§2 Nr. 17' }
  ];

  const initializeCosts = () => {
    return costCategories.map(cat => ({
      ...cat,
      selected: false,
      amount: '',
      distribution: 'Flaeche',
      distributionBase: 0
    }));
  };

  useEffect(() => {
    if (data.costs.length === 0) {
      setData(prev => ({ ...prev, costs: initializeCosts() }));
    }
  }, []);

  const updateCost = (index, field, value) => {
    const newCosts = [...data.costs];
    newCosts[index] = { ...newCosts[index], [field]: value };
    setData({ ...data, costs: newCosts });
  };

  const getTotalCosts = () => {
    return data.costs
      .filter(c => c.selected && c.amount)
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6">
      <div className="vf-wizard">
        <div className="vf-wizard__header">
          <div className="flex justify-between items-center">
            <h1 className="vf-wizard__title">Betriebskostenabrechnung erstellen</h1>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="vf-wizard__progress">
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <div className="vf-wizard__step">
                <div className={`vf-wizard__step-dot ${
                  index < step ? 'vf-wizard__step-dot--completed' : 
                  index === step ? 'vf-wizard__step-dot--active' : ''
                }`} />
                <span className={`vf-wizard__step-label ${index === step ? 'vf-wizard__step-label--active' : ''}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`vf-wizard__step-line ${index < step ? 'vf-wizard__step-line--completed' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="vf-wizard__body">
          {step === 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Wählen Sie das Objekt</h2>
              </div>
              <VfSelect
                label="Gebäude"
                value={data.building_id}
                onChange={(v) => setData({ ...data, building_id: v })}
                options={buildings.map(b => ({ value: b.id, label: b.adresse || b.name }))}
                placeholder="Gebäude auswählen..."
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Abrechnungszeitraum festlegen</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <VfInput
                  label="Abrechnungsjahr"
                  type="number"
                  value={data.year}
                  onChange={(e) => setData({ ...data, year: parseInt(e.target.value) })}
                />
                <div></div>
                <VfDatePicker
                  label="Zeitraum von"
                  value={data.period_from}
                  onChange={(date) => setData({ ...data, period_from: date })}
                />
                <VfDatePicker
                  label="Zeitraum bis"
                  value={data.period_to}
                  onChange={(date) => setData({ ...data, period_to: date })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Euro className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Kosten erfassen</h2>
              </div>
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
                  {data.costs.map((cat, index) => (
                    <tr key={cat.id}>
                      <td className="vf-cost-table__category">
                        <input 
                          type="checkbox" 
                          className="mr-2" 
                          checked={cat.selected}
                          onChange={(e) => updateCost(index, 'selected', e.target.checked)}
                        />
                        {cat.label}
                        <span className="text-xs text-[var(--theme-text-muted)] ml-2">{cat.betrKV}</span>
                      </td>
                      <td className="vf-cost-table__amount">
                        <VfInput 
                          type="number" 
                          rightAddon="€"
                          value={cat.amount}
                          onChange={(e) => updateCost(index, 'amount', e.target.value)}
                          disabled={!cat.selected}
                        />
                      </td>
                      <td>
                        <VfSelect
                          value={cat.distribution}
                          onChange={(v) => updateCost(index, 'distribution', v)}
                          options={[
                            { value: 'Flaeche', label: 'Fläche' },
                            { value: 'Personen', label: 'Personen' },
                            { value: 'Einheiten', label: 'Einheiten' },
                            { value: 'Verbrauch', label: 'Verbrauch' }
                          ]}
                          disabled={!cat.selected}
                        />
                      </td>
                      <td className="vf-cost-table__belege">
                        <Button variant="outline" size="sm" disabled={!cat.selected}>+ Beleg</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 p-4 bg-[var(--theme-surface)] rounded-lg">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Gesamtkosten:</span>
                  <CurrencyDisplay amount={getTotalCosts()} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Verteilung auf Einheiten</h2>
              </div>
              <div className="space-y-3">
                {units.filter(u => data.selectedUnits.includes(u.id)).map(unit => (
                  <Card key={unit.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{unit.bezeichnung || `Einheit ${unit.nummer}`}</div>
                        <div className="text-sm text-[var(--theme-text-muted)]">
                          {unit.flaeche_qm} m² • {unit.anzahl_personen || 0} Personen
                        </div>
                      </div>
                      <div className="text-right">
                        <CurrencyDisplay amount={getTotalCosts() * (unit.flaeche_qm / units.reduce((s, u) => s + (u.flaeche_qm || 0), 0))} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Vorschau & Finalisierung</h2>
              </div>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Zusammenfassung</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-secondary)]">Abrechnungsjahr:</span>
                    <span className="font-medium">{data.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-secondary)]">Zeitraum:</span>
                    <span className="font-medium">
                      {data.period_from} - {data.period_to}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-secondary)]">Anzahl Einheiten:</span>
                    <span className="font-medium">{data.selectedUnits.length}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold">Gesamtkosten:</span>
                    <CurrencyDisplay amount={getTotalCosts()} className="font-semibold text-lg" />
                  </div>
                </div>
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Wird erstellt...' : 'Abrechnung erstellen'}
                </Button>
              </Card>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-[var(--vf-success-500)] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Abrechnung erstellt!</h2>
              <p className="text-[var(--theme-text-secondary)] mb-6">
                Die Betriebskostenabrechnung wurde erfolgreich erstellt.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/operating-costs')}>
                  Zur Übersicht
                </Button>
                <Button variant="gradient">
                  <Send className="h-4 w-4 mr-2" />
                  Jetzt versenden
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="vf-wizard__footer">
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Button variant="gradient" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}>
            Weiter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}