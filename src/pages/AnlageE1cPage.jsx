import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Download, Trash2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AnlageE1cPage() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rental_income: 0,
    operating_costs: 0,
    maintenance: 0,
    insurance: 0,
    mortgage_interest: 0,
    depreciation: 0,
    repairs: 0,
    other_expenses: 0
  });

  const queryClient = useQueryClient();

  const { data: calculation = {}, isLoading } = useQuery({
    queryKey: ['taxCalculationE1c', taxYear, properties],
    queryFn: async () => {
      if (properties.length === 0) return {};
      const response = await base44.functions.invoke('calculateTaxAT_E1c', {
        taxYear,
        properties
      });
      return response.data?.calculation || {};
    },
    enabled: properties.length > 0
  });

  const addProperty = () => {
    if (formData.rental_income > 0) {
      setProperties([...properties, { ...formData, id: Date.now() }]);
      setFormData({
        rental_income: 0,
        operating_costs: 0,
        maintenance: 0,
        insurance: 0,
        mortgage_interest: 0,
        depreciation: 0,
        repairs: 0,
        other_expenses: 0
      });
      setShowForm(false);
    }
  };

  const removeProperty = (id) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const totalExpenses = properties.reduce((sum, p) => 
    sum + (p.operating_costs || 0) + (p.maintenance || 0) + (p.insurance || 0) + 
    (p.mortgage_interest || 0) + (p.depreciation || 0) + (p.repairs || 0) + (p.other_expenses || 0), 0
  );

  const totalRentalIncome = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏘️ Anlage E1c - Vermietung/Verpachtung</h1>
        <p className="text-slate-500 mt-1">Verwalten und berechnen Sie Ihre Vermietungseinkünfte</p>
      </div>

      {/* Year Selector */}
      <div className="max-w-xs">
        <label className="text-sm font-medium">Steuerjahr</label>
        <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Properties Summary */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Anzahl Immobilien</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{properties.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Gesamtmieteinnahmen</p>
              <p className="text-3xl font-bold text-green-600 mt-2">€{Math.round(totalRentalIncome).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Gesamtausgaben</p>
              <p className="text-3xl font-bold text-red-600 mt-2">€{Math.round(totalExpenses).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Properties List */}
      {properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Erfasste Immobilien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.map((prop, i) => {
              const propExpenses = (prop.operating_costs || 0) + (prop.maintenance || 0) + 
                                  (prop.insurance || 0) + (prop.mortgage_interest || 0) + 
                                  (prop.depreciation || 0) + (prop.repairs || 0) + (prop.other_expenses || 0);
              const netIncome = (prop.rental_income || 0) - propExpenses;
              
              return (
                <div key={prop.id} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold">Immobilie {i + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProperty(prop.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-slate-600">Mieteinnahmen</p>
                      <p className="font-bold">€{Math.round(prop.rental_income || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Betriebskosten</p>
                      <p className="font-bold">€{Math.round(prop.operating_costs || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Hypothekenzinsen</p>
                      <p className="font-bold">€{Math.round(prop.mortgage_interest || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Netto</p>
                      <p className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{Math.round(netIncome).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add Property Form */}
      {showForm && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Neue Immobilie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Mieteinnahmen (€)</label>
                <Input
                  type="number"
                  value={formData.rental_income}
                  onChange={(e) => setFormData({...formData, rental_income: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Betriebskosten (€)</label>
                <Input
                  type="number"
                  value={formData.operating_costs}
                  onChange={(e) => setFormData({...formData, operating_costs: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Instandhaltung (€)</label>
                <Input
                  type="number"
                  value={formData.maintenance}
                  onChange={(e) => setFormData({...formData, maintenance: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Versicherung (€)</label>
                <Input
                  type="number"
                  value={formData.insurance}
                  onChange={(e) => setFormData({...formData, insurance: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Hypothekenzinsen (€)</label>
                <Input
                  type="number"
                  value={formData.mortgage_interest}
                  onChange={(e) => setFormData({...formData, mortgage_interest: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Abschreibung (€)</label>
                <Input
                  type="number"
                  value={formData.depreciation}
                  onChange={(e) => setFormData({...formData, depreciation: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addProperty}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Hinzufügen
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Immobilie hinzufügen
        </Button>
      )}

      {/* Calculation Results */}
      {isLoading ? (
        <div className="text-center py-8">⏳ Berechnung wird durchgeführt...</div>
      ) : calculation.taxable_income !== undefined && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-300 bg-slate-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Steuerpflichtiges Einkommen</p>
                <p className="text-3xl font-bold mt-2">€{Math.round(calculation.taxable_income).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Geschätzte Steuer</p>
                <p className="text-3xl font-bold text-red-600 mt-2">€{Math.round(calculation.total_tax).toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-2">Satz: {calculation.tax_rate}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Berechnung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gesamtmieteinnahmen:</span>
                <span className="font-bold">€{Math.round(calculation.total_rental_income).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Grundfreibetrag:</span>
                <span className="font-bold">-€{calculation.basic_deduction}</span>
              </div>
              <div className="flex justify-between">
                <span>Abzugsf. Ausgaben:</span>
                <span className="font-bold">-€{Math.round(calculation.deductible_expenses).toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Steuerpflichtiges Einkommen:</span>
                <span>€{Math.round(calculation.taxable_income).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}