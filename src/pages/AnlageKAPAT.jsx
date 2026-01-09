import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const INVESTMENT_TYPES = ['sparbuch', 'geldmarkt', 'aktien', 'etf', 'fonds', 'anleihen', 'lebensversicherung', 'sonstige'];

export default function AnlageKAPAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    investment_type: 'sparbuch',
    institution: '',
    income_type: 'zinsen',
    gross_income: 0
  });

  const queryClient = useQueryClient();

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const { data: calculation } = useQuery({
    queryKey: ['calculationAT', taxYear],
    queryFn: async () => {
      const res = await base44.functions.invoke('calculateTaxAT', {
        userId: (await base44.auth.me()).id,
        taxYear
      });
      return res;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestmentAT.create({
      ...data,
      tax_year: taxYear,
      gross_income: Number(data.gross_income)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentsAT'] });
      queryClient.invalidateQueries({ queryKey: ['calculationAT'] });
      setShowForm(false);
      setFormData({ title: '', investment_type: 'sparbuch', institution: '', income_type: 'zinsen', gross_income: 0 });
      toast.success('Investment hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestmentAT.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentsAT'] });
      queryClient.invalidateQueries({ queryKey: ['calculationAT'] });
      toast.success('Investment gelöscht');
    }
  });

  const handleSubmit = () => {
    if (!formData.title || formData.gross_income <= 0) {
      toast.error('Pflichtfelder erforderlich');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🇦🇹 Beilage E1kv</h1>
          <p className="text-slate-500 mt-1">Kapitalvermögen - Steuerjahr {taxYear}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Hinzufügen
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bezeichnung *</Label>
                <Input
                  placeholder="z.B. 'Erste Bank Sparbuch'"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Art</Label>
                <Select value={formData.investment_type} onValueChange={(v) => setFormData({ ...formData, investment_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Institution *</Label>
                <Input
                  placeholder="z.B. 'Erste Bank AG'"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Ertragsart</Label>
                <Select value={formData.income_type} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zinsen">Zinsen</SelectItem>
                    <SelectItem value="dividenden">Dividenden</SelectItem>
                    <SelectItem value="sonstige">Sonstige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Bruttoertrag EUR *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gross_income}
                  onChange={(e) => setFormData({ ...formData, gross_income: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {calculation && (
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
          <CardHeader>
            <CardTitle>📊 KESt-Berechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Bruttoertrag</p>
                <p className="text-lg font-bold">€{calculation.totals.grossIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Sparerfreibetrag</p>
                <p className="text-lg font-bold">€{calculation.totals.allowanceUsed.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Zu versteuern</p>
                <p className="text-lg font-bold">€{calculation.totals.taxableIncomeKap.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">KESt 27.5%</p>
                <p className="text-lg font-bold text-red-600">€{calculation.calculations.kest.toPay.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Kapitalanlagen ({investments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Einträge</p>
          ) : (
            <div className="space-y-2">
              {investments.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{inv.title}</p>
                    <p className="text-xs text-slate-500">{inv.institution}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold">€{inv.gross_income.toFixed(2)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(inv.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}