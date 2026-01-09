import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, CheckCircle2, AlertCircle, Download, Calculator } from 'lucide-react';
import TaxExportDialogAT from '@/components/tax/TaxExportDialogAT';
import TaxOptimizationPanel from '@/components/tax/TaxOptimizationPanel';
import TaxLawUpdatesAlert from '@/components/tax/TaxLawUpdatesAlert';
import TaxValidationDisplay from '@/components/tax/TaxValidationDisplay';
import TaxCalculationDisplay from '@/components/tax/TaxCalculationDisplay';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxDashboardAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const { data: otherIncomes = [] } = useQuery({
    queryKey: ['otherIncomesAT', taxYear],
    queryFn: () => base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
  });

  const { data: realEstates = [] } = useQuery({
    queryKey: ['realEstatesAT', taxYear],
    queryFn: () => base44.entities.RealEstate.filter({ tax_year: taxYear }) || []
  });

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const { data } = await base44.functions.invoke('validateTaxDataAT', { taxYear });
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
      const { data } = await base44.functions.invoke('calculateTaxAT', { taxYear });
      setCalculationResult(data);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const forms = [
    {
      id: 'anlage_kap',
      title: 'Anlage KAP',
      subtitle: 'Einkünfte aus Kapitalvermögen',
      path: 'AnlageKAPAT',
      count: investments.length,
      icon: '💰'
    },
    {
      id: 'anlage_so',
      title: 'Anlage SO',
      subtitle: 'Sonstige Einkünfte',
      path: 'AnlageSOAT',
      count: otherIncomes.length,
      icon: '📋'
    },
    {
      id: 'anlage_e1c',
      title: 'Anlage E1c',
      subtitle: 'Vermietung & Verpachtung',
      path: 'AnlageE1cAT',
      count: realEstates.length,
      icon: '🏠'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🇦🇹 Steuern Österreich</h1>
          <p className="text-slate-500 mt-1">Steuerjahr {taxYear}</p>
        </div>
        <div className="flex gap-3">
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
      <TaxLawUpdatesAlert country="AT" />

      {/* Validation Results */}
      {validationResult && (
        <TaxValidationDisplay validation={validationResult} isLoading={false} />
      )}

      {/* Calculation Results */}
      {calculationResult && (
        <TaxCalculationDisplay
          calculation={calculationResult}
          country="AT"
          isLoading={false}
        />
      )}

      {/* Tax Optimization Panel */}
      <TaxOptimizationPanel country="AT" taxYear={taxYear} />

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
                    {form.count > 0 ? 'Bearbeiten' : 'Erstellen'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle>📊 Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Kapitalvermögen</p>
              <p className="text-2xl font-bold">{investments.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Sonstige Einkünfte</p>
              <p className="text-2xl font-bold">{otherIncomes.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Immobilien</p>
              <p className="text-2xl font-bold">{realEstates.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-2xl font-bold text-blue-600">
                {investments.length + otherIncomes.length + realEstates.length > 0 ? '✅' : '⏳'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <TaxExportDialogAT open={showExportDialog} onOpenChange={setShowExportDialog} taxYear={taxYear} />
    </div>
  );
}