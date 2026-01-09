import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AnlageSODE() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    income_type: 'sonstige',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    frequency: 'einmalig',
    withheld_tax: 0,
    deductible_expenses: 0,
    tax_year: taxYear
  });

  const queryClient = useQueryClient();

  const { data: otherIncomes = [] } = useQuery({
    queryKey: ['otherIncomesDE', taxYear],
    queryFn: () => base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OtherIncomeAT.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomesDE', taxYear] });
      setShowForm(false);
      setFormData({ description: '', income_type: 'sonstige', amount: 0, date: new Date().toISOString().split('T')[0], is_recurring: false, frequency: 'einmalig', withheld_tax: 0, deductible_expenses: 0, tax_year: taxYear });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OtherIncomeAT.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomesDE', taxYear] });
    }
  });

  const handleSubmit = async () => {
    if (!formData.description || formData.amount <= 0) return;
    await createMutation.mutateAsync({ ...formData, tax_year: taxYear });
  };

  const totalIncome = otherIncomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalDeductions = otherIncomes.reduce((s, i) => s + (i.deductible_expenses || 0), 0);
  const taxableAmount = totalIncome - totalDeductions;

  const incomeTypes = {
    'rente_private': 'Private Rente',
    'unterhalt': 'Unterhaltsleistungen',
    'gl%C3%BCcksspiel': 'Glücksspielgewinne',
    'private_veraeusserung': 'Private Veräußerung',
    'lebensversicherung': 'Lebensversicherung',
    'steuererstattung': 'Steuererstattung',
    'sonstige': 'Sonstige Einkünfte'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anlage SO - Sonstige Einkünfte</h1>
          <p className="text-slate-500 mt-1">Deutschland Steuerjahr {taxYear}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Hinzufügen
          </Button>
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4" /> PDF Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Gesamteinkommen</p>
              <p className="text-2xl font-bold">€{totalIncome.toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Abzüge</p>
              <p className="text-2xl font-bold">€{totalDeductions.toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Zu versteuern</p>
              <p className="text-2xl font-bold text-blue-600">€{taxableAmount.toLocaleString('de-DE')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="border-blue-300">
          <CardHeader>
            <CardTitle>Neue Einkunft erfassen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Art der Einkunft</label>
                <Select value={formData.income_type} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(incomeTypes).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Betrag (€)</label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Z.B. Renteneinkünfte von XYZ Versicherung"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Datum</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Einbehaltene Steuer (€)</label>
                <Input
                  type="number"
                  value={formData.withheld_tax}
                  onChange={(e) => setFormData({ ...formData, withheld_tax: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Werbungskosten (€)</label>
              <Input
                type="number"
                value={formData.deductible_expenses}
                onChange={(e) => setFormData({ ...formData, deductible_expenses: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Speichern
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {otherIncomes.map((income) => (
          <Card key={income.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{income.description}</h3>
                    <Badge className="bg-blue-100 text-blue-800">{incomeTypes[income.income_type]}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Datum: {new Date(income.date).toLocaleDateString('de-DE')}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Betrag:</span>
                      <p className="font-semibold">€{(income.amount || 0).toLocaleString('de-DE')}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Abzüge:</span>
                      <p className="font-semibold">€{(income.deductible_expenses || 0).toLocaleString('de-DE')}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Zu versteuern:</span>
                      <p className="font-semibold">€{((income.amount || 0) - (income.deductible_expenses || 0)).toLocaleString('de-DE')}</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => deleteMutation.mutate(income.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {otherIncomes.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Keine Einkünfte erfasst. Klicken Sie auf "Hinzufügen" um zu starten.
          </div>
        )}
      </div>
    </div>
  );
}