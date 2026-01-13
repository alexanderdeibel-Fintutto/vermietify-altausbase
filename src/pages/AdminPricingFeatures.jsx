import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricingFeatures() {
  const [editingFeature, setEditingFeature] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [priceTypeFilter, setPriceTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ['featureGroups'],
    queryFn: () => base44.entities.FeatureGroup.list('-sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['allFeatures'],
    queryFn: () => base44.entities.Feature.list('-sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Feature.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeatures'] });
      setDialogOpen(false);
      setEditingFeature(null);
      toast.success('Feature erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Feature.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeatures'] });
      setDialogOpen(false);
      setEditingFeature(null);
      toast.success('Feature aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Feature.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeatures'] });
      toast.success('Feature gelöscht');
    }
  });

  const filteredFeatures = features.filter(f => 
    priceTypeFilter === 'all' || f.price_type === priceTypeFilter
  );

  const priceTypeColors = {
    FREE: 'bg-green-100 text-green-700',
    MONTHLY: 'bg-blue-100 text-blue-700',
    YEARLY: 'bg-purple-100 text-purple-700',
    ONE_TIME: 'bg-amber-100 text-amber-700',
    PER_USE: 'bg-orange-100 text-orange-700',
    PER_UNIT: 'bg-pink-100 text-pink-700',
    TRANSACTION: 'bg-red-100 text-red-700',
    AFFILIATE: 'bg-indigo-100 text-indigo-700'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Features</h1>
          <p className="text-sm text-slate-600">Verwalte atomare Features</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFeature(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFeature ? 'Feature bearbeiten' : 'Neues Feature'}</DialogTitle>
            </DialogHeader>
            <FeatureForm 
              feature={editingFeature}
              groups={groups}
              features={features}
              onSave={(data) => {
                if (editingFeature) {
                  updateMutation.mutate({ id: editingFeature.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingFeature(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <Select value={priceTypeFilter} onValueChange={setPriceTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Preistypen</SelectItem>
            <SelectItem value="FREE">Kostenlos</SelectItem>
            <SelectItem value="MONTHLY">Monatlich</SelectItem>
            <SelectItem value="YEARLY">Jährlich</SelectItem>
            <SelectItem value="PER_USE">Pro Nutzung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {groups.map(group => {
          const groupFeatures = filteredFeatures.filter(f => f.group_id === group.id);
          
          return (
            <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="secondary">{groupFeatures.length} Features</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4">
                  <table className="w-full">
                    <thead className="text-xs text-slate-600 border-b">
                      <tr>
                        <th className="text-left py-2">Code</th>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Preistyp</th>
                        <th className="text-right py-2">Preis</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-right py-2">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupFeatures.map(feature => (
                        <tr key={feature.id} className="border-b hover:bg-slate-50">
                          <td className="py-3">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {feature.feature_code}
                            </code>
                          </td>
                          <td className="py-3 font-medium text-sm">{feature.name}</td>
                          <td className="py-3">
                            <Badge className={priceTypeColors[feature.price_type]}>
                              {feature.price_type}
                            </Badge>
                          </td>
                          <td className="py-3 text-right text-sm">
                            {feature.standalone_price ? 
                              `${(feature.standalone_price / 100).toFixed(2)}€` : 
                              '-'
                            }
                          </td>
                          <td className="py-3 text-center">
                            {feature.is_active ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">✓</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">-</Badge>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setEditingFeature(feature);
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm('Feature wirklich löschen?')) {
                                    deleteMutation.mutate(feature.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function FeatureForm({ feature, groups, features, onSave, onCancel }) {
  const [formData, setFormData] = useState(feature || {
    feature_code: '',
    name: '',
    description: '',
    internal_notes: '',
    group_id: groups[0]?.id || '',
    is_quantifiable: false,
    quantity_unit: '',
    standalone_price: null,
    price_type: 'FREE',
    requires_features: '[]',
    conflicts_with: '[]',
    is_active: true,
    sort_order: 0,
    technical_key: '',
    metadata: '{}'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Grunddaten</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input 
              value={formData.feature_code} 
              onChange={e => setFormData({...formData, feature_code: e.target.value.toUpperCase()})}
              placeholder="BANK_API"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Bank-API (finAPI)"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gruppe *</Label>
            <Select value={formData.group_id} onValueChange={v => setFormData({...formData, group_id: v})}>
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
          <div className="space-y-2">
            <Label>Technischer Key</Label>
            <Input 
              value={formData.technical_key} 
              onChange={e => setFormData({...formData, technical_key: e.target.value})}
              placeholder="banking_api"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Beschreibung (für Kunden)</Label>
          <Textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Interne Notizen (für Entwickler)</Label>
          <Textarea 
            value={formData.internal_notes} 
            onChange={e => setFormData({...formData, internal_notes: e.target.value})}
            rows={2}
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-slate-900">Preisgestaltung</h3>
        
        <div className="space-y-2">
          <Label>Preistyp *</Label>
          <Select value={formData.price_type} onValueChange={v => setFormData({...formData, price_type: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">Kostenlos</SelectItem>
              <SelectItem value="MONTHLY">Monatlich</SelectItem>
              <SelectItem value="YEARLY">Jährlich</SelectItem>
              <SelectItem value="ONE_TIME">Einmalig</SelectItem>
              <SelectItem value="PER_USE">Pro Nutzung</SelectItem>
              <SelectItem value="PER_UNIT">Pro Einheit</SelectItem>
              <SelectItem value="TRANSACTION">Transaktion</SelectItem>
              <SelectItem value="AFFILIATE">Affiliate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_quantifiable} 
            onCheckedChange={v => setFormData({...formData, is_quantifiable: v})}
          />
          <Label>Quantifizierbar (Mengenbegrenzung)</Label>
        </div>

        {formData.is_quantifiable && (
          <div className="space-y-2">
            <Label>Einheit</Label>
            <Input 
              value={formData.quantity_unit} 
              onChange={e => setFormData({...formData, quantity_unit: e.target.value})}
              placeholder="Objekte, WE, Dokumente"
            />
          </div>
        )}

        {formData.price_type !== 'FREE' && (
          <div className="space-y-2">
            <Label>Einzelpreis (Cent)</Label>
            <Input 
              type="number"
              value={formData.standalone_price || ''} 
              onChange={e => setFormData({...formData, standalone_price: e.target.value ? Number(e.target.value) : null})}
              placeholder="490"
            />
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-slate-900">Status</h3>
        
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.is_active} 
            onCheckedChange={v => setFormData({...formData, is_active: v})}
          />
          <Label>Feature ist aktiv</Label>
        </div>

        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input 
            type="number"
            value={formData.sort_order} 
            onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </form>
  );
}