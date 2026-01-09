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

export default function AnlageSOAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    income_type: 'rente_private',
    amount: 0,
    date: '',
    is_recurring: false
  });

  const queryClient = useQueryClient();

  const { data: incomes = [] } = useQuery({
    queryKey: ['otherIncomesAT', taxYear],
    queryFn: () => base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OtherIncomeAT.create({
      ...data,
      tax_year: taxYear,
      amount: Number(data.amount),
      taxable_amount: Number(data.amount)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomesAT'] });
      setShowForm(false);
      setFormData({ description: '', income_type: 'rente_private', amount: 0, date: '', is_recurring: false });
      toast.success('Einkunft hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OtherIncomeAT.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomesAT'] });
      toast.success('Einkunft gelöscht');
    }
  });

  const handleSubmit = () => {
    if (!formData.description || formData.amount <= 0 || !formData.date) {
      toast.error('Pflichtfelder erforderlich');
      return;
    }
    createMutation.mutate(formData);
  };

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🇦🇹 Sonstige Einkünfte</h1>
          <p className="text-slate-500 mt-1">Steuerjahr {taxYear}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Hinzufügen
        </Button>
      </div>

      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Beschreibung *</Label>
                <Input
                  placeholder="z.B. 'Privatrente', 'Unterhaltsleistung'"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Art</Label>
                <Select value={formData.income_type} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rente_private">Privatrente</SelectItem>
                    <SelectItem value="unterhalt">Unterhalt</SelectItem>
                    <SelectItem value="glücksspiel">Glücksspiel</SelectItem>
                    <SelectItem value="sonstige">Sonstige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Betrag EUR *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1"
                />
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
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-slate-50 to-yellow-50">
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600 mb-2">Gesamteinkünfte</p>
          <p className="text-3xl font-bold">€{totalIncome.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Einträge ({incomes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Einträge</p>
          ) : (
            <div className="space-y-2">
              {incomes.map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{inc.description}</p>
                    <p className="text-xs text-slate-500">{inc.income_type}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold">€{inc.amount.toFixed(2)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(inc.id)} className="text-red-600">
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