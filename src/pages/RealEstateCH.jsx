import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const CANTONS = ['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE', 'VS', 'NE', 'JU', 'SO', 'SH', 'TG', 'TI', 'GR', 'AR', 'AI', 'GL', 'OW', 'NW', 'UR', 'ZG'];

export default function RealEstateCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('ZH');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: properties = [] } = useQuery({
    queryKey: ['realEstatesCH', taxYear, canton],
    queryFn: () => base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [],
    enabled: !!canton
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RealEstateCH.create({ ...data, tax_year: taxYear, canton }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstatesCH', taxYear, canton] });
      setFormData({});
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RealEstateCH.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['realEstatesCH', taxYear, canton] })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const totalValue = properties.reduce((s, p) => s + (p.current_market_value || 0), 0);
  const totalMortgage = properties.reduce((s, p) => s + (p.mortgage_debt || 0), 0);
  const totalRental = properties.reduce((s, p) => s + (p.rental_income || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏠 Liegenschaften Schweiz</h1>
          <p className="text-slate-500 mt-1">Immobilien und Mieteinnahmen</p>
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
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({}); }} className="gap-2 bg-blue-600">
            <Plus className="w-4 h-4" /> Hinzufügen
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Marktwert</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">CHF {totalValue.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Hypothekarschuld</p>
            <p className="text-3xl font-bold mt-2 text-red-600">CHF {totalMortgage.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Mieteinnahmen</p>
            <p className="text-3xl font-bold mt-2 text-green-600">CHF {totalRental.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle>Neue Liegenschaft hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Objektbezeichnung"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <Input placeholder="Adresse" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                <Input placeholder="Gemeinde" value={formData.municipality || ''} onChange={(e) => setFormData({ ...formData, municipality: e.target.value })} />
                <Input type="number" placeholder="Marktwert CHF" value={formData.current_market_value || ''} onChange={(e) => setFormData({ ...formData, current_market_value: Number(e.target.value) })} required />
                <Input type="number" placeholder="Hypothekarschuld CHF" value={formData.mortgage_debt || ''} onChange={(e) => setFormData({ ...formData, mortgage_debt: Number(e.target.value) })} />
                <Input type="number" placeholder="Mieteinnahmen CHF" value={formData.rental_income || ''} onChange={(e) => setFormData({ ...formData, rental_income: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_primary_residence || false}
                  onChange={(e) => setFormData({ ...formData, is_primary_residence: e.target.checked })}
                />
                <label className="text-sm">Hauptwohnsitz (Eigennutzung)</label>
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
        {properties.length > 0 ? (
          properties.map(prop => (
            <Card key={prop.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{prop.title}</h3>
                    <p className="text-sm text-slate-600">{prop.address} • {prop.municipality}</p>
                    {prop.is_primary_residence && <Badge className="mt-2 bg-blue-100 text-blue-800">Hauptwohnsitz</Badge>}
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-slate-600">Marktwert</p>
                    <p className="text-lg font-bold">CHF {(prop.current_market_value || 0).toLocaleString('de-CH')}</p>
                    <p className="text-xs text-slate-500">Schuld: CHF {(prop.mortgage_debt || 0).toLocaleString('de-CH')}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(prop.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine Liegenschaften erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}