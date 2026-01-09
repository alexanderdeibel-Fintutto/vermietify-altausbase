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
const SWISS_CANTONS = { ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', AG: 'Aargau', SG: 'Sankt Gallen', VS: 'Wallis', VD: 'Waadt', TI: 'Tessin', GE: 'Genf', BS: 'Basel-Stadt' };

export default function RealEstateCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'eigenheim',
    address: '',
    municipality: '',
    acquisition_price: 0,
    current_market_value: 0,
    rental_income: 0,
    is_primary_residence: true
  });

  const queryClient = useQueryClient();

  const { data: properties = [] } = useQuery({
    queryKey: ['realEstateCH', taxYear, canton],
    queryFn: () => canton ? base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || [] : [],
    enabled: !!canton
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RealEstateCH.create({
      ...data,
      tax_year: taxYear,
      canton: canton,
      acquisition_price: Number(data.acquisition_price),
      current_market_value: Number(data.current_market_value),
      rental_income: Number(data.rental_income)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['realEstateCH'] });
      setShowForm(false);
      toast.success('Liegenschaft hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RealEstateCH.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['realEstateCH'] })
  });

  const totalValue = properties.reduce((sum, p) => sum + p.current_market_value, 0);
  const totalRental = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🏠 Liegenschaften {taxYear}</h1>
        <div className="w-40">
          <Select value={canton} onValueChange={setCanton}>
            <SelectTrigger>
              <SelectValue placeholder="Kanton..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SWISS_CANTONS).map(([code, name]) => (
                <SelectItem key={code} value={code}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {canton && (
        <>
          {showForm && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 space-y-4">
                <Input placeholder="Adresse" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                <Input placeholder="Gemeinde" value={formData.municipality} onChange={(e) => setFormData({ ...formData, municipality: e.target.value })} />
                <Input placeholder="Kaufpreis CHF" type="number" value={formData.acquisition_price} onChange={(e) => setFormData({ ...formData, acquisition_price: e.target.value })} />
                <Input placeholder="Marktwert CHF" type="number" value={formData.current_market_value} onChange={(e) => setFormData({ ...formData, current_market_value: e.target.value })} />
                <Input placeholder="Mieteinnahmen CHF" type="number" value={formData.rental_income} onChange={(e) => setFormData({ ...formData, rental_income: e.target.value })} />
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
                  <Button onClick={() => createMutation.mutate(formData)}>Speichern</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Card className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Gesamtwert</p>
                <p className="text-2xl font-bold">CHF {totalValue.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-slate-50 to-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Mieteinnahmen</p>
                <p className="text-2xl font-bold">CHF {totalRental.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" /> Hinzufügen
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liegenschaften ({properties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-sm text-slate-500">Keine Liegenschaften</p>
              ) : (
                <div className="space-y-2">
                  {properties.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.address}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold">CHF {p.current_market_value.toFixed(0)}</p>
                        <p className="text-xs text-slate-500">Miete: CHF {(p.rental_income || 0).toFixed(0)}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}