import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const ASSET_TYPES = ['immobilie', 'grundstueck', 'wertpapier', 'kryptowährung', 'beteiligung', 'sonstige'];

export default function AnlageVGAT() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: gains = [] } = useQuery({
    queryKey: ['capitalGainsAT', taxYear],
    queryFn: () => base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const holdingPeriod = Math.floor((new Date(data.sale_date) - new Date(data.acquisition_date)) / (365.25 * 24 * 60 * 60 * 1000));
      return base44.entities.CapitalGainAT.create({
        ...data,
        tax_year: taxYear,
        holding_period_years: holdingPeriod,
        gain_loss: (data.sale_price || 0) - (data.acquisition_cost || 0) - (data.selling_cost || 0)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGainsAT', taxYear] });
      setFormData({});
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CapitalGainAT.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGainsAT', taxYear] });
      setFormData({});
      setEditingId(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CapitalGainAT.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['capitalGainsAT', taxYear] })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (gain) => {
    setEditingId(gain.id);
    setFormData(gain);
    setShowForm(true);
  };

  const totals = {
    gains: gains.filter(g => (g.gain_loss || 0) > 0).reduce((s, g) => s + (g.gain_loss || 0), 0),
    losses: Math.abs(gains.filter(g => (g.gain_loss || 0) < 0).reduce((s, g) => s + (g.gain_loss || 0), 0)),
    net: gains.reduce((s, g) => s + (g.gain_loss || 0), 0)
  };

  const taxableGains = gains.filter(g => !g.is_tax_exempt && (g.gain_loss || 0) > 0);

  const handleExportPDF = async () => {
    try {
      const { data } = await base44.functions.invoke('generatePDFAnlageAT', {
        taxYear,
        anlageType: 'VG'
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
          <h1 className="text-3xl font-bold">📈 Anlage VG - Veräußerungsgewinne</h1>
          <p className="text-slate-500 mt-1">Gewinne und Verluste aus Wertpapieren und Immobilien</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gewinne</p>
            <p className="text-3xl font-bold mt-2 text-green-600">€{totals.gains.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Verluste</p>
            <p className="text-3xl font-bold mt-2 text-red-600">€{totals.losses.toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Netto</p>
            <p className={`text-3xl font-bold mt-2 ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{totals.net.toLocaleString('de-AT')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Steuerpflichtig</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">€{taxableGains.reduce((s, g) => s + (g.gain_loss || 0), 0).toLocaleString('de-AT')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle>{editingId ? 'Bearbeiten' : 'Neue Veräußerung'}</CardTitle>
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
                <Select value={formData.asset_type || ''} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vermögensart" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" placeholder="Verkaufsdatum" value={formData.sale_date || ''} onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })} required />
                <Input type="date" placeholder="Anschaffungsdatum" value={formData.acquisition_date || ''} onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })} required />
                <Input type="number" placeholder="Verkaufspreis €" value={formData.sale_price || ''} onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })} required />
                <Input type="number" placeholder="Anschaffungskosten €" value={formData.acquisition_cost || ''} onChange={(e) => setFormData({ ...formData, acquisition_cost: Number(e.target.value) })} required />
                <Input type="number" placeholder="Herstellungskosten €" value={formData.improvement_cost || ''} onChange={(e) => setFormData({ ...formData, improvement_cost: Number(e.target.value) })} />
                <Input type="number" placeholder="Verkaufskosten €" value={formData.selling_cost || ''} onChange={(e) => setFormData({ ...formData, selling_cost: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_tax_exempt || false}
                  onChange={(e) => setFormData({ ...formData, is_tax_exempt: e.target.checked })}
                />
                <label className="text-sm">Steuerbefreiung (z.B. Privatvermögen)</label>
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
        {gains.length > 0 ? (
          gains.map(gain => (
            <Card key={gain.id} className={`hover:shadow-md transition-shadow ${gain.is_tax_exempt ? 'bg-green-50' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{gain.description}</h3>
                    <p className="text-sm text-slate-600">{gain.asset_type}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{gain.acquisition_date} - {gain.sale_date}</Badge>
                      {gain.is_tax_exempt && <Badge className="bg-green-100 text-green-800">Steuerbefreit</Badge>}
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-slate-600">Gewinn/Verlust</p>
                    <p className={`text-lg font-bold ${(gain.gain_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{(gain.gain_loss || 0).toLocaleString('de-AT')}
                    </p>
                    <p className="text-xs text-slate-500">{gain.holding_period_years || 0}a Haltedauer</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(gain)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(gain.id)} className="text-red-600">
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
              Keine Veräußerungsgewinne erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}