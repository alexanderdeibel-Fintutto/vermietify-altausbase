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
const INVESTMENT_TYPES = ['sparbuch', 'geldmarkt', 'aktien', 'etf', 'fonds', 'anleihen', 'lebensversicherung', 'sonstige'];
const INCOME_TYPES = ['zinsen', 'dividenden', 'ausschuettungen', 'kursgewinne', 'sonstige'];

export default function AnlageKAPAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsAT', taxYear],
    queryFn: () => base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestmentAT.create({ ...data, tax_year: taxYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentsAT', taxYear] });
      setFormData({});
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestmentAT.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentsAT', taxYear] });
      setFormData({});
      setEditingId(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestmentAT.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investmentsAT', taxYear] })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (inv) => {
    setEditingId(inv.id);
    setFormData(inv);
    setShowForm(true);
  };

  const totals = {
    income: investments.reduce((s, i) => s + (i.gross_income || 0), 0),
    kest: investments.reduce((s, i) => s + (i.withheld_tax_kest || 0), 0),
    net: investments.reduce((s, i) => s + ((i.gross_income || 0) - (i.withheld_tax_kest || 0)), 0)
  };

  const handleExportPDF = async () => {
    try {
      const { data } = await base44.functions.invoke('generatePDFAnlageAT', {
        taxYear,
        anlageType: 'KAP'
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
          <h1 className="text-3xl font-bold">💰 Anlage KAP - Kapitalvermögen</h1>
          <p className="text-slate-500 mt-1">Einkünfte aus Kapitalvermögen</p>
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
            <p className="text-sm text-slate-600">Bruttoertrag</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">€{totals.income.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">KESt 27,5%</p>
            <p className="text-3xl font-bold mt-2 text-red-600">€{totals.kest.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Nettoertrag</p>
            <p className="text-3xl font-bold mt-2 text-green-600">€{totals.net.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle>{editingId ? 'Bearbeiten' : 'Neue Kapitalanlage'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Titel"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <Select value={formData.investment_type || ''} onValueChange={(v) => setFormData({ ...formData, investment_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Institution" value={formData.institution || ''} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} />
                <Input placeholder="ISIN/WKN" value={formData.isin_wkn || ''} onChange={(e) => setFormData({ ...formData, isin_wkn: e.target.value })} />
                <Select value={formData.income_type || ''} onValueChange={(v) => setFormData({ ...formData, income_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ertragsart" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Bruttoertrag €" value={formData.gross_income || ''} onChange={(e) => setFormData({ ...formData, gross_income: Number(e.target.value) })} required />
                <Input type="number" placeholder="KESt €" value={formData.withheld_tax_kest || ''} onChange={(e) => setFormData({ ...formData, withheld_tax_kest: Number(e.target.value) })} />
                <Input type="number" placeholder="Kirchensteuer €" value={formData.church_tax || ''} onChange={(e) => setFormData({ ...formData, church_tax: Number(e.target.value) })} />
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
        {investments.length > 0 ? (
          investments.map(inv => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{inv.title}</h3>
                    <p className="text-sm text-slate-600">{inv.institution} • {inv.investment_type}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{inv.income_type}</Badge>
                      {inv.isin_wkn && <Badge variant="outline">{inv.isin_wkn}</Badge>}
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-slate-600">Ertrag</p>
                    <p className="text-lg font-bold">€{(inv.gross_income || 0).toLocaleString('de-AT')}</p>
                    <p className="text-xs text-slate-500">KESt: €{(inv.withheld_tax_kest || 0).toLocaleString('de-AT')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(inv)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(inv.id)} className="text-red-600">
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
              Keine Kapitalanlagen erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}