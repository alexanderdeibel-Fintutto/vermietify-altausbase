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
import { Plus, Edit, Eye, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = [
  { value: 'CORE', label: 'Core' },
  { value: 'ADD_ON', label: 'Add-On' },
  { value: 'STANDALONE', label: 'Standalone' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'FREEMIUM', label: 'Freemium' }
];

const TARGET_AUDIENCES = [
  { value: 'PRIVATVERMIETER', label: 'Privatvermieter' },
  { value: 'SEMI_PROFI', label: 'Semi-Profi' },
  { value: 'PROFI', label: 'Profi' },
  { value: 'HAUSVERWALTUNG', label: 'Hausverwaltung' },
  { value: 'WEG', label: 'WEG' },
  { value: 'MAKLER', label: 'Makler' },
  { value: 'MIETER', label: 'Mieter' },
  { value: 'STEUERBERATER', label: 'Steuerberater' }
];

export default function AdminPricingProducts() {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editDialog, setEditDialog] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order')
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: productFeatures = [] } = useQuery({
    queryKey: ['productFeatures'],
    queryFn: () => base44.entities.ProductFeature.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setEditDialog(null);
      toast.success('Produkt erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setEditDialog(null);
      toast.success('Produkt aktualisiert');
    }
  });

  const filtered = products.filter(p => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (filterStatus === 'active' && !p.is_active) return false;
    if (filterStatus === 'inactive' && p.is_active) return false;
    if (filterStatus === 'coming_soon' && !p.is_coming_soon) return false;
    return true;
  });

  const handleSave = () => {
    const data = {
      ...formData,
      target_audience: formData.target_audience ? JSON.stringify(formData.target_audience) : null
    };

    if (editDialog?.id) {
      updateMutation.mutate({ id: editDialog.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (product = null) => {
    if (product) {
      setFormData({
        ...product,
        target_audience: product.target_audience ? JSON.parse(product.target_audience) : []
      });
    } else {
      setFormData({
        product_code: '',
        name: '',
        category: 'CORE',
        description: '',
        target_audience: [],
        icon: 'Building2',
        color: '#10B981',
        is_active: false,
        is_coming_soon: false,
        sort_order: products.length + 1
      });
    }
    setEditDialog(product || { new: true });
  };

  const getFeatureCount = (productId) => {
    return productFeatures.filter(pf => pf.product_id === productId).length;
  };

  const toggleAudience = (value) => {
    const current = formData.target_audience || [];
    if (current.includes(value)) {
      setFormData({ ...formData, target_audience: current.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, target_audience: [...current, value] });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Produkte verwalten</h1>
          <p className="text-slate-500 mt-1">Apps und Produkte im Portfolio</p>
        </div>
        <Button onClick={() => openEdit()}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Produkt
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Kategorie</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Kategorie</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Features</th>
                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </td>
                  <td className="p-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">{product.product_code}</code>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: product.color }}
                      >
                        {product.name.charAt(0)}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{product.category}</Badge>
                  </td>
                  <td className="p-4">
                    {product.is_active && (
                      <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                    )}
                    {product.is_coming_soon && (
                      <Badge className="bg-blue-100 text-blue-800">Coming Soon</Badge>
                    )}
                    {!product.is_active && !product.is_coming_soon && (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <Link to={createPageUrl(`AdminPricingProductFeatures?product_id=${product.id}`)}>
                      <Button variant="ghost" size="sm">
                        {getFeatureCount(product.id)} Features
                      </Button>
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editDialog?.new ? 'Neues Produkt' : 'Produkt bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={formData.product_code || ''}
                  onChange={e => setFormData({ ...formData, product_code: e.target.value.toUpperCase() })}
                  placeholder="VERMIETER_PRO"
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Vermieter Pro"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={v => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sortierung</Label>
                <Input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Zielgruppen</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TARGET_AUDIENCES.map(ta => (
                  <div key={ta.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.target_audience || []).includes(ta.value)}
                      onCheckedChange={() => toggleAudience(ta.value)}
                    />
                    <span className="text-sm">{ta.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon</Label>
                <Input
                  value={formData.icon || ''}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Building2"
                />
              </div>
              <div>
                <Label>Farbe</Label>
                <Input
                  type="color"
                  value={formData.color || '#10B981'}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_active || false}
                  onCheckedChange={v => setFormData({ ...formData, is_active: v })}
                />
                <Label>Produkt ist aktiv</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_coming_soon || false}
                  onCheckedChange={v => setFormData({ ...formData, is_coming_soon: v })}
                />
                <Label>Coming Soon anzeigen</Label>
              </div>
            </div>

            {formData.is_coming_soon && (
              <div>
                <Label>Launch-Datum</Label>
                <Input
                  type="date"
                  value={formData.launch_date || ''}
                  onChange={e => setFormData({ ...formData, launch_date: e.target.value })}
                />
              </div>
            )}
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