import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const INCOME_TYPES = ['rente_private', 'unterhalt', 'gluecksspiel', 'private_veraeusserung', 'lebensversicherung', 'steuererstattung', 'sonstige'];

export default function AnlageSOAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: incomes = [] } = useQuery({
    queryKey: ['otherIncomesAT', taxYear],
    queryFn: () => base44.entities.OtherIncomeAT.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OtherIncomeAT.create({ ...data, tax_year: taxYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomesAT', taxYear] });
      setFormData({});
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.OtherIncomeAT.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherIncomesAT', taxYear] });
      setFormData({});
      setEditingId(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OtherIncomeAT.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['otherIncomesAT', taxYear] })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (income) => {
    setEditingId(income.id);
    setFormData(income);
    setShowForm(true);
  };

  const totals = {
    income: incomes.reduce((s, i) => s + (i.amount || 0), 0),
    taxable: incomes.reduce((s, i) => s + (i.taxable_amount || i.amount || 0), 0),
    deductions: incomes.reduce((s, i) => s + (i.deductible_expenses || 0), 0)
  };

  const handleExportPDF = async () => {
    try {
      const { data } = await base44.functions.invoke('generatePDFAnlageAT', {
        taxYear,
        anlageType: 'SO'
      });
      if (data.file_url) {
        window.open(data.file_url, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Anlage SO - Sonstige Einkünfte</h1>
          <p className="text-slate-500 mt-1">Renten, Unterhaltsleistungen und sonstige Einkünfte</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({}); }} className="gap-2 bg-blue-600">
            <Plus className="w-4 h-4" /> Hinzufügen
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamteinkommen</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">€{totals.income.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Abzüge</p>
            <p className="text-3xl font-bold mt-2 text-orange-600">€{totals.deductions.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Zu versteuern</p>
            <p className="text-3xl font-bold mt-2 text-green-600">€{totals.taxable.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle>{editingId ? 'Bearbeiten' : 'Neue sonstige Einkunft'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Beschreibung"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <Select value={formData.income_type || ''} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Art der Einkunft" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Betrag €" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required />
                <Input type="number" placeholder="Abzüge €" value={formData.deductible_expenses || ''} onChange={(e) => setFormData({ ...formData, deductible_expenses: Number(e.target.value) })} />
                <Input type="date" placeholder="Datum" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-green-600">Speichern</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingId(null); setFormData({}); }}>Abbrechen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {incomes.length > 0 ? (
          incomes.map(income => (
            <Card key={income.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{income.description}</h3>
                    <p className="text-sm text-slate-600">{income.income_type}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(income.date).toLocaleDateString('de-AT')}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-slate-600">Betrag</p>
                    <p className="text-lg font-bold">€{(income.amount || 0).toLocaleString('de-AT')}</p>
                    {income.deductible_expenses > 0 && (
                      <p className="text-xs text-slate-500">Abzug: €{(income.deductible_expenses || 0).toLocaleString('de-AT')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(income)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(income.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine sonstigen Einkünfte erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}