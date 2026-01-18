import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfInput } from '@/components/shared/VfInput';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowRight, X, Calendar, Building, TrendingUp, TrendingDown, FileText, Download, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AnlageVWizardEnhanced() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [data, setData] = useState({
    year: new Date().getFullYear() - 1,
    selectedBuildings: [],
    income: {},
    expenses: {},
    afa: {}
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    const buildingsList = await base44.entities.Building.list();
    setBuildings(buildingsList);
  };

  const getTotalIncome = () => {
    return Object.values(data.income).reduce((sum, v) => sum + parseFloat(v || 0), 0);
  };

  const getTotalExpenses = () => {
    return Object.values(data.expenses).reduce((sum, v) => sum + parseFloat(v || 0), 0);
  };

  const getNetIncome = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      for (const buildingId of data.selectedBuildings) {
        const anlageV = await base44.entities.AnlageV.create({
          building_id: buildingId,
          tax_year: data.year,
          status: 'CALCULATED',
          total_rentals: getTotalIncome(),
          total_expenses: getTotalExpenses(),
          net_income: getNetIncome(),
          notes: 'Erstellt über Wizard'
        });

        // Create income entries
        await base44.entities.AnlageVEinnahmen.create({
          anlage_v_id: anlageV.id,
          description: 'Kaltmiete',
          category: 'COLD_RENT',
          amount: parseFloat(data.income.kaltmiete || 0),
          months: 12
        });

        // Create expense entries
        if (data.expenses.reparaturen) {
          await base44.entities.AnlageVWerbungskosten.create({
            anlage_v_id: anlageV.id,
            description: 'Reparaturen',
            category: 'REPAIR',
            amount: parseFloat(data.expenses.reparaturen),
            is_deductible: true
          });
        }
      }

      toast.success('Anlage V erfolgreich erstellt!');
      navigate('/tax-property-module');
    } catch (error) {
      toast.error('Fehler beim Erstellen der Anlage V');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'year', title: 'Steuerjahr' },
    { id: 'buildings', title: 'Objekte' },
    { id: 'income', title: 'Einnahmen' },
    { id: 'expenses', title: 'Werbungskosten' },
    { id: 'summary', title: 'Zusammenfassung' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6">
      <div className="vf-wizard">
        <div className="vf-wizard__header">
          <div className="flex justify-between items-center">
            <h1 className="vf-wizard__title">Anlage V erstellen</h1>
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
                <Calendar className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Wählen Sie das Steuerjahr</h2>
              </div>
              <VfInput
                label="Steuerjahr"
                type="number"
                value={data.year}
                onChange={(e) => setData({ ...data, year: parseInt(e.target.value) })}
                hint="Für welches Steuerjahr möchten Sie die Anlage V erstellen?"
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Wählen Sie die Objekte</h2>
              </div>
              <div className="space-y-2">
                {buildings.map(building => (
                  <Card key={building.id} className="p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.selectedBuildings.includes(building.id)}
                        onChange={(e) => {
                          const newSelected = e.target.checked
                            ? [...data.selectedBuildings, building.id]
                            : data.selectedBuildings.filter(id => id !== building.id);
                          setData({ ...data, selectedBuildings: newSelected });
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{building.adresse || building.name}</div>
                        <div className="text-sm text-[var(--theme-text-muted)]">
                          {building.baujahr} • {building.anzahl_einheiten} Einheiten
                        </div>
                      </div>
                    </label>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-8 w-8 text-[var(--vf-success-600)]" />
                <h2 className="text-xl font-semibold">Mieteinnahmen erfassen</h2>
              </div>
              <div className="space-y-4">
                <VfInput
                  label="Kaltmiete (Jahressumme)"
                  type="number"
                  rightAddon="€"
                  value={data.income.kaltmiete || ''}
                  onChange={(e) => setData({ ...data, income: { ...data.income, kaltmiete: e.target.value }})}
                  hint="Summe aller Kaltmieten für das gesamte Jahr"
                />
                <VfInput
                  label="Nebenkosten-Vorauszahlungen"
                  type="number"
                  rightAddon="€"
                  value={data.income.nebenkosten || ''}
                  onChange={(e) => setData({ ...data, income: { ...data.income, nebenkosten: e.target.value }})}
                />
                <VfInput
                  label="Sonstige Einnahmen (z.B. Stellplatz)"
                  type="number"
                  rightAddon="€"
                  value={data.income.sonstige || ''}
                  onChange={(e) => setData({ ...data, income: { ...data.income, sonstige: e.target.value }})}
                />
                <div className="p-4 bg-[var(--vf-success-50)] rounded-lg border border-[var(--vf-success-200)]">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Gesamteinnahmen:</span>
                    <CurrencyDisplay amount={getTotalIncome()} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <TrendingDown className="h-8 w-8 text-[var(--vf-error-600)]" />
                <h2 className="text-xl font-semibold">Werbungskosten erfassen</h2>
              </div>
              <div className="space-y-4">
                <VfInput
                  label="Reparaturen & Instandhaltung"
                  type="number"
                  rightAddon="€"
                  value={data.expenses.reparaturen || ''}
                  onChange={(e) => setData({ ...data, expenses: { ...data.expenses, reparaturen: e.target.value }})}
                />
                <VfInput
                  label="Versicherungen"
                  type="number"
                  rightAddon="€"
                  value={data.expenses.versicherungen || ''}
                  onChange={(e) => setData({ ...data, expenses: { ...data.expenses, versicherungen: e.target.value }})}
                />
                <VfInput
                  label="Grundsteuer"
                  type="number"
                  rightAddon="€"
                  value={data.expenses.grundsteuer || ''}
                  onChange={(e) => setData({ ...data, expenses: { ...data.expenses, grundsteuer: e.target.value }})}
                />
                <VfInput
                  label="Verwaltungskosten"
                  type="number"
                  rightAddon="€"
                  value={data.expenses.verwaltung || ''}
                  onChange={(e) => setData({ ...data, expenses: { ...data.expenses, verwaltung: e.target.value }})}
                />
                <VfInput
                  label="Zinsen & Finanzierung"
                  type="number"
                  rightAddon="€"
                  value={data.expenses.zinsen || ''}
                  onChange={(e) => setData({ ...data, expenses: { ...data.expenses, zinsen: e.target.value }})}
                />
                <VfInput
                  label="AfA (Abschreibung)"
                  type="number"
                  rightAddon="€"
                  value={data.expenses.afa || ''}
                  onChange={(e) => setData({ ...data, expenses: { ...data.expenses, afa: e.target.value }})}
                />
                <div className="p-4 bg-[var(--vf-error-50)] rounded-lg border border-[var(--vf-error-200)]">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Gesamtausgaben:</span>
                    <CurrencyDisplay amount={getTotalExpenses()} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-8 w-8 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-semibold">Zusammenfassung & Export</h2>
              </div>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Anlage V für {data.year}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-secondary)]">Anzahl Objekte:</span>
                    <span className="font-medium">{data.selectedBuildings.length}</span>
                  </div>
                  <div className="flex justify-between text-[var(--vf-success-600)]">
                    <span>Einnahmen:</span>
                    <CurrencyDisplay amount={getTotalIncome()} />
                  </div>
                  <div className="flex justify-between text-[var(--vf-error-600)]">
                    <span>Werbungskosten:</span>
                    <CurrencyDisplay amount={getTotalExpenses()} />
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg">
                    <span className="font-semibold">Einkünfte aus V+V:</span>
                    <CurrencyDisplay 
                      amount={getNetIncome()} 
                      className="font-semibold"
                      colored
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Wird gespeichert...' : 'Als Entwurf speichern'}
                  </Button>
                  <Button 
                    variant="gradient" 
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Erstellen & exportieren
                  </Button>
                </div>
              </Card>
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