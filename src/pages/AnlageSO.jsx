import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const INCOME_TYPES = ['rente_private', 'unterhalt', 'lotto_gewinn', 'private_veraeusserung', 'lebensversicherung', 'steuererstattung', 'sonstige'];

export default function AnlageSO() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    income_type: 'rente_private',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    allowable_expenses: 0
  });

  const queryClient = useQueryClient();

  const { data: otherIncomes = [] } = useQuery({
    queryKey: ['otherIncomes', taxYear],
    queryFn: () => base44.entities.OtherIncome.filter({ tax_year: taxYear }) || []
  });

  const { data: calculation } = useQuery({
    queryKey: ['calculationSO', taxYear],
    queryFn: async () => {
      const res = await base44.functions.invoke('calculateTaxSO', {
        userId: (await base44.auth.me()).id,
        taxYear
      });
      return res.result;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OtherIncome.create({
      ...data,
      tax_year: taxYear,
      amount: Number(data.amount),
      allowable_expenses: Number(data.allowable_expenses),
      net_income: Number(data.amount) - Number(data.allowable_expenses)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['calculationSO'] });
      setShowForm(false);
      setFormData({
        description: '',
        income_type: 'rente_private',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        allowable_expenses: 0
      });
      toast.success('Einkunft hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OtherIncome.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['calculationSO'] });
      toast.success('Einkunft gelöscht');
    }
  });

  const handleSubmit = () => {
    const errors = [];
    if (!formData.description || formData.description.length === 0) errors.push('Beschreibung erforderlich');
    if (formData.amount <= 0) errors.push('Betrag muss > 0 sein');
    if (formData.allowable_expenses > formData.amount) errors.push('Werbungskosten dürfen Betrag nicht übersteigen');
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Anlage SO</h1>
          <p className="text-slate-500 mt-1">Sonstige Einkünfte - Steuerjahr {taxYear}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Einkunft hinzufügen
        </Button>
      </div>

      {/* Warning - 600€ Threshold */}
      {calculation && calculation.threshold.totalIncome > 600 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle>600€-Freigrenze überschritten</AlertTitle>
          <AlertDescription>
            Ihre sonstigen Einkünfte (${calculation.threshold.totalIncome.toFixed(2)}€) überschreiten die 600€-Freigrenze. 
            Der gesamte Betrag ist zu versteuern.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Beschreibung *</Label>
                <Input
                  placeholder="z.B. 'Betriebsrente 2024'"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Art der Einkunft *</Label>
                <Select value={formData.income_type} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Betrag in EUR *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Werbungskosten (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.allowable_expenses}
                  onChange={(e) => setFormData({ ...formData, allowable_expenses: e.target.value })}
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
        <Card className="bg-gradient-to-br from-slate-50 to-green-50">
          <CardHeader>
            <CardTitle>📊 Berechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Gesamtbetrag</p>
                <p className="text-lg font-bold">{calculation.totals.netIncome.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">600€-Freigrenze</p>
                <p className={`text-lg font-bold ${calculation.threshold.isExempt ? 'text-green-600' : 'text-red-600'}`}>
                  {calculation.threshold.isExempt ? '✓' : '✗'} {calculation.threshold.freigrenze}€
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Zu versteuern</p>
                <p className="text-lg font-bold">{calculation.threshold.taxable.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Status</p>
                <p className={`text-lg font-bold ${calculation.threshold.isExempt ? 'text-green-600' : 'text-orange-600'}`}>
                  {calculation.threshold.isExempt ? 'Steuerfrei' : 'Steuerpflichtig'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incomes List */}
      <Card>
        <CardHeader>
          <CardTitle>Sonstige Einkünfte ({otherIncomes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {otherIncomes.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Einkünfte eingetragen</p>
            ) : (
              otherIncomes.map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{inc.description}</p>
                    <p className="text-xs text-slate-500">{inc.income_type} · {new Date(inc.date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold">{inc.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                    {inc.allowable_expenses > 0 && (
                      <p className="text-xs text-slate-500">−{inc.allowable_expenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(inc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}