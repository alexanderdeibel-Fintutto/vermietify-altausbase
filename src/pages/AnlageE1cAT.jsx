import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();

export default function AnlageE1cAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const queryClient = useQueryClient();

  const { data: realEstates = [], isLoading } = useQuery({
    queryKey: ['realEstates', taxYear],
    queryFn: () => base44.entities.RealEstate.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RealEstate.create({ ...data, tax_year: taxYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstates', taxYear] });
      setShowForm(false);
      setFormData(null);
      toast.success('Immobilie hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RealEstate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstates', taxYear] });
      toast.success('Immobilie gelöscht');
    }
  });

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const { data } = await base44.functions.invoke('calculateTaxAT_E1c', { taxYear });
      setCalculationResult(data);
      toast.success('Berechnung erfolgreich');
    } catch (error) {
      toast.error('Fehler bei der Berechnung');
    } finally {
      setIsCalculating(false);
    }
  };

  const totalRentalIncome = realEstates.reduce((sum, re) => sum + (re.annual_rental_income || 0), 0);
  const totalMortgageInterest = realEstates.reduce((sum, re) => sum + (re.mortgage_interest || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anlage E1c - Vermietung & Verpachtung</h1>
          <p className="text-slate-500 mt-1">Österreich {taxYear}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || realEstates.length === 0}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Calculator className="w-4 h-4" /> Berechnen
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Immobilie hinzufügen
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Neue Immobilie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Titel (z.B. Wohnhaus Wien)"
              value={formData?.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              placeholder="Jährliche Mieteinnahmen (€)"
              type="number"
              value={formData?.annual_rental_income || ''}
              onChange={(e) => setFormData({ ...formData, annual_rental_income: Number(e.target.value) })}
            />
            <Input
              placeholder="Hypothekarzinsen (€)"
              type="number"
              value={formData?.mortgage_interest || ''}
              onChange={(e) => setFormData({ ...formData, mortgage_interest: Number(e.target.value) })}
            />
            <Input
              placeholder="Unterhaltskosten (€)"
              type="number"
              value={formData?.maintenance_costs || ''}
              onChange={(e) => setFormData({ ...formData, maintenance_costs: Number(e.target.value) })}
            />
            <Input
              placeholder="Grundsteuer (€)"
              type="number"
              value={formData?.property_tax || ''}
              onChange={(e) => setFormData({ ...formData, property_tax: Number(e.target.value) })}
            />
            <Input
              placeholder="Versicherungskosten (€)"
              type="number"
              value={formData?.insurance_costs || ''}
              onChange={(e) => setFormData({ ...formData, insurance_costs: Number(e.target.value) })}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => createMutation.mutate(formData)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Speichern
              </Button>
              <Button
                onClick={() => { setShowForm(false); setFormData(null); }}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamtmieteinnahmen</p>
            <p className="text-2xl font-bold">€{totalRentalIncome.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Hypothekarzinsen</p>
            <p className="text-2xl font-bold">€{totalMortgageInterest.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Immobilien</p>
            <p className="text-2xl font-bold">{realEstates.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Real Estates List */}
      {!isLoading && realEstates.length > 0 ? (
        <div className="space-y-3">
          {realEstates.map((re) => (
            <Card key={re.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{re.title}</h3>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-slate-600">Mieteinnahmen</p>
                        <p className="font-bold">€{(re.annual_rental_income || 0).toLocaleString('de-AT')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Hypothekarzinsen</p>
                        <p className="font-bold">€{(re.mortgage_interest || 0).toLocaleString('de-AT')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Unterhaltskosten</p>
                        <p className="font-bold">€{(re.maintenance_costs || 0).toLocaleString('de-AT')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Netto</p>
                        <p className="font-bold text-green-600">
                          €{(
                            (re.annual_rental_income || 0) -
                            (re.mortgage_interest || 0) -
                            (re.maintenance_costs || 0) -
                            (re.property_tax || 0) -
                            (re.insurance_costs || 0)
                          ).toLocaleString('de-AT')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteMutation.mutate(re.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Calculation Result */}
      {calculationResult && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300">
          <CardHeader>
            <CardTitle>📊 Steuerberechnung E1c</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Gesamteinnahmen</p>
                <p className="text-lg font-bold">€{calculationResult.summary?.rentalIncome?.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Gesamtausgaben</p>
                <p className="text-lg font-bold">€{calculationResult.summary?.totalExpenses?.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Nettoeinkommen (E1c)</p>
                <p className="text-lg font-bold text-green-600">€{calculationResult.summary?.netRentalIncome?.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Geschätzte Einkommensteuer</p>
                <p className="text-lg font-bold text-red-600">€{calculationResult.taxes?.estimatedIncomeTax?.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}