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
const CANTONS = ['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE', 'VS', 'NE', 'JU', 'SO', 'SH', 'TG', 'TI', 'GR', 'AR', 'AI', 'GL', 'OW', 'NW', 'UR', 'ZG'];
const INVESTMENT_TYPES = ['aktien', 'anleihen', 'fonds', 'etf', 'immobilienfonds', 'kryptowährung', 'rohstoffe', 'sonstige'];

export default function InvestmentsCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('ZH');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, canton],
    queryFn: () => base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
    enabled: !!canton
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestmentCH.create({ ...data, tax_year: taxYear, canton }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentsCH', taxYear, canton] });
      setFormData({});
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestmentCH.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investmentsCH', taxYear, canton] })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const totalValue = investments.reduce((s, i) => s + ((i.current_value || 0) * (i.quantity || 0)), 0);
  const totalDividends = investments.reduce((s, i) => s + (i.dividend_income || 0), 0);
  const totalInterest = investments.reduce((s, i) => s + (i.interest_income || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Wertschriften Schweiz</h1>
          <p className="text-slate-500 mt-1">Aktien, Fonds, Anleihen und andere Wertschriften</p>
        </div>
        <div className="flex gap-2">
          <Select value={canton} onValueChange={setCanton}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANTONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({}); }} className="gap-2 bg-blue-600">
            <Plus className="w-4 h-4" /> Hinzufügen
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamtwert</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">CHF {totalValue.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Dividenden</p>
            <p className="text-3xl font-bold mt-2 text-green-600">CHF {totalDividends.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Zinsen</p>
            <p className="text-3xl font-bold mt-2 text-green-600">CHF {totalInterest.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle>Neue Wertschrift hinzufügen</CardTitle>
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
                <Input placeholder="Bank/Depot" value={formData.institution || ''} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} required />
                <Input placeholder="ISIN" value={formData.isin || ''} onChange={(e) => setFormData({ ...formData, isin: e.target.value })} />
                <Input type="number" placeholder="Menge" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
                <Input type="number" placeholder="Aktueller Wert CHF" value={formData.current_value || ''} onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })} required />
                <Input type="number" placeholder="Dividenden CHF" value={formData.dividend_income || ''} onChange={(e) => setFormData({ ...formData, dividend_income: Number(e.target.value) })} />
                <Input type="number" placeholder="Zinsen CHF" value={formData.interest_income || ''} onChange={(e) => setFormData({ ...formData, interest_income: Number(e.target.value) })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-green-600">Speichern</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setFormData({}); }}>Abbrechen</Button>
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
                    <p className="text-sm text-slate-600">{inv.institution}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{inv.investment_type}</Badge>
                      {inv.isin && <Badge variant="outline">{inv.isin}</Badge>}
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-slate-600">{inv.quantity} Stk.</p>
                    <p className="text-lg font-bold">CHF {((inv.current_value || 0) * (inv.quantity || 0)).toLocaleString('de-CH')}</p>
                    {inv.dividend_income > 0 && <p className="text-xs text-slate-500">Div: CHF {inv.dividend_income.toLocaleString('de-CH')}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(inv.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine Wertschriften erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}