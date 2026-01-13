import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

const PRICE_TYPES = [
  { value: 'FREE', label: 'Kostenlos' },
  { value: 'MONTHLY', label: 'Monatlich' },
  { value: 'YEARLY', label: 'Jährlich' },
  { value: 'ONE_TIME', label: 'Einmalig' },
  { value: 'PER_USE', label: 'Pro Nutzung' },
  { value: 'PER_UNIT', label: 'Pro Einheit' },
  { value: 'TRANSACTION', label: 'Transaktion' },
  { value: 'AFFILIATE', label: 'Affiliate' }
];

export default function AdminPricingFeatures() {
  const [editDialog, setEditDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const [filterGroup, setFilterGroup] = useState('all');
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list('sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Feature.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['features']);
      setEditDialog(null);
      toast.success('Feature erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Feature.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['features']);
      setEditDialog(null);
      toast.success('Feature aktualisiert');
    }
  });

  const handleSave = () => {
    const data = {
      ...formData,
      standalone_price: formData.standalone_price ? parseInt(formData.standalone_price) : null
    };

    if (editDialog?.id) {
      updateMutation.mutate({ id: editDialog.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (feature = null, groupId = null) => {
    if (feature) {
      setFormData({ ...feature });
    } else {
      setFormData({
        feature_code: '',
        name: '',
        description: '',
        internal_notes: '',
        group_id: groupId || groups[0]?.id,
        is_quantifiable: false,
        quantity_unit: '',
        standalone_price: null,
        price_type: 'FREE',
        requires_features: '',
        conflicts_with: '',
        is_active: true,
        sort_order: features.filter(f => f.group_id === groupId).length + 1,
        technical_key: ''
      });
    }
    setEditDialog(feature || { new: true });
  };

  const groupedFeatures = groups.map(group => ({
    ...group,
    features: features.filter(f => f.group_id === group.id)
  }));

  const formatPrice = (cents) => {
    if (!cents) return '-';
    return `${(cents / 100).toFixed(2)}€`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Features verwalten</h1>
          <p className="text-slate-500 mt-1">Atomare Features definieren</p>
        </div>
        <Button onClick={() => openEdit()}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Feature
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {groupedFeatures.map(group => (
          <AccordionItem key={group.id} value={group.id} asChild>
            <Card>
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{group.name}</div>
                    <div className="text-sm text-slate-500">{group.features.length} Features</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4">
                  <div className="flex justify-end mb-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(null, group.id)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Feature hinzufügen
                    </Button>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-y">
                      <tr>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Preistyp</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Preis</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 uppercase">Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.features.map(feature => (
                        <tr key={feature.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">{feature.feature_code}</code>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{feature.name}</div>
                              {feature.is_quantifiable && (
                                <div className="text-xs text-slate-500">Einheit: {feature.quantity_unit}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{feature.price_type}</Badge>
                          </td>
                          <td className="p-3">{formatPrice(feature.standalone_price)}</td>
                          <td className="p-3">
                            {feature.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                            ) : (
                              <Badge variant="outline">Inaktiv</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(feature)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {group.features.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Keine Features in dieser Gruppe
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editDialog?.new ? 'Neues Feature' : 'Feature bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold mb-3">Grunddaten</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Code *</Label>
                    <Input
                      value={formData.feature_code || ''}
                      onChange={e => setFormData({ ...formData, feature_code: e.target.value.toUpperCase() })}
                      placeholder="BANK_API"
                    />
                  </div>
                  <div>
                    <Label>Gruppe *</Label>
                    <Select
                      value={formData.group_id}
                      onValueChange={v => setFormData({ ...formData, group_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bank-API (finAPI)"
                  />
                </div>

                <div>
                  <Label>Technischer Key</Label>
                  <Input
                    value={formData.technical_key || ''}
                    onChange={e => setFormData({ ...formData, technical_key: e.target.value })}
                    placeholder="banking_api"
                  />
                  <p className="text-xs text-slate-500 mt-1">Für Feature-Flags im Code</p>
                </div>

                <div>
                  <Label>Beschreibung (für Kunden)</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Interne Notizen</Label>
                  <Textarea
                    value={formData.internal_notes || ''}
                    onChange={e => setFormData({ ...formData, internal_notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Preisgestaltung</h3>
              <div className="space-y-4">
                <div>
                  <Label>Preistyp *</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={v => setFormData({ ...formData, price_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_TYPES.map(pt => (
                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.is_quantifiable || false}
                    onCheckedChange={v => setFormData({ ...formData, is_quantifiable: v })}
                  />
                  <Label>Quantifizierbar (Mengenbegrenzung)</Label>
                </div>

                {formData.is_quantifiable && (
                  <div>
                    <Label>Einheit</Label>
                    <Input
                      value={formData.quantity_unit || ''}
                      onChange={e => setFormData({ ...formData, quantity_unit: e.target.value })}
                      placeholder="Objekte, WE, Dokumente"
                    />
                  </div>
                )}

                <div>
                  <Label>Einzelpreis (in Cent)</Label>
                  <Input
                    type="number"
                    value={formData.standalone_price || ''}
                    onChange={e => setFormData({ ...formData, standalone_price: e.target.value })}
                    placeholder="490"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leer lassen wenn nicht einzeln buchbar
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_active || false}
                  onCheckedChange={v => setFormData({ ...formData, is_active: v })}
                />
                <Label>Feature ist aktiv</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}