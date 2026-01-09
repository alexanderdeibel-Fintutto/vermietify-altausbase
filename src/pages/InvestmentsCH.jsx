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

export default function InvestmentsCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    investment_type: 'aktien',
    institution: '',
    quantity: 0,
    acquisition_price: 0,
    current_value: 0,
    dividend_income: 0
  });

  const queryClient = useQueryClient();

  const { data: investments = [] } = useQuery({
    queryKey: ['investmentsCH', taxYear, canton],
    queryFn: () => canton ? base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [] : [],
    enabled: !!canton
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestmentCH.create({
      ...data,
      tax_year: taxYear,
      canton: canton,
      quantity: Number(data.quantity),
      acquisition_price: Number(data.acquisition_price),
      current_value: Number(data.current_value),
      dividend_income: Number(data.dividend_income)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentsCH'] });
      setShowForm(false);
      setFormData({ title: '', investment_type: 'aktien', institution: '', quantity: 0, acquisition_price: 0, current_value: 0, dividend_income: 0 });
      toast.success('Wertschrift hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestmentCH.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investmentsCH'] })
  });

  const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value * inv.quantity), 0);
  const totalDividends = investments.reduce((sum, inv) => sum + inv.dividend_income, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🇨🇭 Wertschriften {taxYear}</h1>
        <div className="w-40">
          <Select value={canton} onValueChange={setCanton}>
            <SelectTrigger>
              <SelectValue placeholder="Kanton wählen..." />
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
                <Input placeholder="Titel" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <Input placeholder="Anzahl" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                <Input placeholder="Kaufpreis CHF" type="number" value={formData.acquisition_price} onChange={(e) => setFormData({ ...formData, acquisition_price: e.target.value })} />
                <Input placeholder="Aktueller Wert CHF" type="number" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} />
                <Input placeholder="Dividenden CHF" type="number" value={formData.dividend_income} onChange={(e) => setFormData({ ...formData, dividend_income: e.target.value })} />
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
                <p className="text-sm text-slate-600">Dividenden</p>
                <p className="text-2xl font-bold">CHF {totalDividends.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" /> Hinzufügen
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Positionen ({investments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {investments.length === 0 ? (
                <p className="text-sm text-slate-500">Keine Wertschriften</p>
              ) : (
                <div className="space-y-2">
                  {investments.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{inv.title}</p>
                        <p className="text-xs text-slate-500">{inv.quantity}x @ CHF {inv.current_value.toFixed(2)}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold">CHF {(inv.quantity * inv.current_value).toFixed(0)}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(inv.id)} className="text-red-600">
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