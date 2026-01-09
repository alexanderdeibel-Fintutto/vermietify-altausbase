import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Download, Calculator, AlertCircle } from 'lucide-react';
import TaxExportDialogCH from '@/components/tax/TaxExportDialogCH';
import TaxOptimizationPanel from '@/components/tax/TaxOptimizationPanel';
import TaxLawUpdatesAlert from '@/components/tax/TaxLawUpdatesAlert';
import TaxValidationDisplay from '@/components/tax/TaxValidationDisplay';
import TaxCalculationDisplay from '@/components/tax/TaxCalculationDisplay';

const CURRENT_YEAR = new Date().getFullYear();
const CANTONS = ['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE', 'VS', 'NE', 'JU', 'SO', 'SH', 'TG', 'TI', 'GR', 'AR', 'AI', 'GL', 'OW', 'NW', 'UR', 'ZG'];

export default function TaxDashboardCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('ZH');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, canton],
    queryFn: () => base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
    enabled: !!canton
  });

  const { data: realEstates = [] } = useQuery({
    queryKey: ['realEstatesCH', taxYear, canton],
    queryFn: () => base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [],
    enabled: !!canton
  });

  const { data: otherIncomes = [] } = useQuery({
    queryKey: ['otherIncomesCH', taxYear, canton],
    queryFn: () => base44.entities.OtherIncomeCH.filter({ tax_year: taxYear, canton }) || [],
    enabled: !!canton
  });

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const { data } = await base44.functions.invoke('validateTaxDataCH', { taxYear, canton });
      setValidationResult(data);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const { data } = await base44.functions.invoke('calculateTaxCH', { taxYear, canton });
      setCalculationResult(data);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const forms = [
    {
      id: 'securities',
      title: 'Wertschriften',
      subtitle: 'Aktien, Fonds, Anleihen',
      path: 'InvestmentsCH',
      count: investments.length,
      icon: '📊'
    },
    {
      id: 'real_estate',
      title: 'Liegenschaften',
      subtitle: 'Immobilien & Mieteinnahmen',
      path: 'RealEstateCH',
      count: realEstates.length,
      icon: '🏠'
    },
    {
      id: 'other_income',
      title: 'Sonstige Einkünfte',
      subtitle: 'Renten, Stipendien, etc.',
      path: 'OtherIncomeCH',
      count: otherIncomes.length,
      icon: '💼'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🇨🇭 Steuern Schweiz</h1>
          <p className="text-slate-500 mt-1">Steuerjahr {taxYear}</p>
        </div>
        <div className="flex gap-3">
          <Select value={canton} onValueChange={setCanton}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANTONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleValidate}
            disabled={isValidating}
            variant="outline"
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" /> Validieren
          </Button>
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Calculator className="w-4 h-4" /> Berechnen
          </Button>
          <Button
            onClick={() => setShowExportDialog(true)}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Exportieren
          </Button>
        </div>
      </div>

      {/* Law Updates Alert */}
      <TaxLawUpdatesAlert country="CH" />

      {/* Validation Results */}
      {validationResult && (
        <TaxValidationDisplay validation={validationResult} isLoading={false} />
      )}

      {/* Calculation Results */}
      {calculationResult && (
        <TaxCalculationDisplay
          calculation={calculationResult}
          country="CH"
          isLoading={false}
        />
      )}

      {/* Tax Optimization Panel */}
      <TaxOptimizationPanel country="CH" taxYear={taxYear} canton={canton} />

      {/* Forms Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Link key={form.id} to={createPageUrl(form.path)}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{form.subtitle}</p>
                  </div>
                  <span className="text-2xl">{form.icon}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge
                    className={
                      form.count > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {form.count > 0
                      ? `✅ ${form.count} Einträge`
                      : '❌ Keine Daten'}
                  </Badge>
                  <p className="text-xs text-slate-600 mt-2">
                    {form.count > 0 ? 'Verwalten' : 'Hinzufügen'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-slate-50 to-green-50">
        <CardHeader>
          <CardTitle>📊 Übersicht {canton}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Wertschriften</p>
              <p className="text-2xl font-bold">{investments.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Liegenschaften</p>
              <p className="text-2xl font-bold">{realEstates.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Sonstige Einkünfte</p>
              <p className="text-2xl font-bold">{otherIncomes.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-2xl font-bold text-green-600">
                {investments.length + realEstates.length + otherIncomes.length > 0 ? '✅' : '⏳'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <TaxExportDialogCH open={showExportDialog} onOpenChange={setShowExportDialog} taxYear={taxYear} />
    </div>
  );
}