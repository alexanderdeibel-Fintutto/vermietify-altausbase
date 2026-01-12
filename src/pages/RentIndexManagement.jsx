import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RentIndexManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    postal_code: '',
    wohnlage: 'Mittel',
    miete_min: '',
    miete_mittel: '',
    miete_max: '',
    mietpreisbremse_aktiv: false,
    kappungsgrenze: 15,
    gueltig_ab: format(new Date(), 'yyyy-MM-dd')
  });

  const queryClient = useQueryClient();

  const { data: indices = [] } = useQuery({
    queryKey: ['rentIndices'],
    queryFn: () => base44.entities.RentIndex.list('-gueltig_ab', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RentIndex.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rentIndices']);
      toast.success('Mietspiegelwert hinzugefügt');
      setDialogOpen(false);
      setFormData({
        city: '',
        postal_code: '',
        wohnlage: 'Mittel',
        miete_min: '',
        miete_mittel: '',
        miete_max: '',
        mietpreisbremse_aktiv: false,
        kappungsgrenze: 15,
        gueltig_ab: format(new Date(), 'yyyy-MM-dd')
      });
    }
  });

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      miete_min: parseFloat(formData.miete_min),
      miete_mittel: parseFloat(formData.miete_mittel),
      miete_max: parseFloat(formData.miete_max)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Mietspiegel-Verwaltung</h1>
          <p className="text-slate-600 mt-1">Vergleichsmietdaten für Mieterhöhungen</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Wert
        </Button>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Hinweis zur Datenquelle</p>
              <p className="text-xs text-amber-700 mt-1">
                Mietspiegeldaten müssen aktuell manuell gepflegt werden. Zukünftige Integration mit 
                offiziellen Mietspiegeln geplant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {indices.map(index => (
          <Card key={index.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{index.city}</p>
                    {index.postal_code && (
                      <Badge variant="outline">{index.postal_code}</Badge>
                    )}
                    <Badge className={
                      index.wohnlage === 'Sehr gut' ? 'bg-emerald-100 text-emerald-700' :
                      index.wohnlage === 'Gut' ? 'bg-blue-100 text-blue-700' :
                      index.wohnlage === 'Mittel' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-700'
                    }>
                      {index.wohnlage}
                    </Badge>
                    {index.mietpreisbremse_aktiv && (
                      <Badge className="bg-red-100 text-red-700">Mietpreisbremse</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span>
                      {index.miete_min.toFixed(2)} - {index.miete_max.toFixed(2)} €/m²
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>Ø {index.miete_mittel.toFixed(2)} €/m²</span>
                    {index.kappungsgrenze && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span>Kappung: {index.kappungsgrenze}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    Gültig ab {format(new Date(index.gueltig_ab), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {indices.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              Keine Mietspiegeldaten vorhanden
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mietspiegelwert hinzufügen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stadt *</Label>
                <Input
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="Berlin"
                />
              </div>
              <div>
                <Label>PLZ</Label>
                <Input
                  value={formData.postal_code}
                  onChange={e => setFormData({...formData, postal_code: e.target.value})}
                  placeholder="10115"
                />
              </div>
            </div>

            <div>
              <Label>Wohnlage *</Label>
              <Select value={formData.wohnlage} onValueChange={v => setFormData({...formData, wohnlage: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Einfach">Einfach</SelectItem>
                  <SelectItem value="Mittel">Mittel</SelectItem>
                  <SelectItem value="Gut">Gut</SelectItem>
                  <SelectItem value="Sehr gut">Sehr gut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Min €/m² *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.miete_min}
                  onChange={e => setFormData({...formData, miete_min: e.target.value})}
                  placeholder="8.50"
                />
              </div>
              <div>
                <Label>Mittel €/m² *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.miete_mittel}
                  onChange={e => setFormData({...formData, miete_mittel: e.target.value})}
                  placeholder="10.00"
                />
              </div>
              <div>
                <Label>Max €/m² *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.miete_max}
                  onChange={e => setFormData({...formData, miete_max: e.target.value})}
                  placeholder="12.50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kappungsgrenze (%)</Label>
                <Input
                  type="number"
                  value={formData.kappungsgrenze}
                  onChange={e => setFormData({...formData, kappungsgrenze: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Gültig ab *</Label>
                <Input
                  type="date"
                  value={formData.gueltig_ab}
                  onChange={e => setFormData({...formData, gueltig_ab: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mietpreisbremse"
                checked={formData.mietpreisbremse_aktiv}
                onChange={e => setFormData({...formData, mietpreisbremse_aktiv: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="mietpreisbremse">Mietpreisbremse aktiv (§556d BGB)</Label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                Hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}