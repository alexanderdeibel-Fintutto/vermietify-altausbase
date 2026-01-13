import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFeatureConfig() {
  const [editingFeature, setEditingFeature] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: features = [] } = useQuery({
    queryKey: ['adminFeatures'],
    queryFn: () => base44.entities.Feature.list()
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Feature.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeatures'] });
      setDialogOpen(false);
      setEditingFeature(null);
      toast.success('Feature erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Feature.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeatures'] });
      setDialogOpen(false);
      setEditingFeature(null);
      toast.success('Feature aktualisiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Feature.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeatures'] });
      toast.success('Feature gelöscht');
    }
  });

  const categoryNames = {
    objektverwaltung: 'Objektverwaltung',
    mieterverwaltung: 'Mieterverwaltung',
    finanzen: 'Finanzen',
    dokumente: 'Dokumente',
    steuern: 'Steuern',
    kommunikation: 'Kommunikation',
    reporting: 'Reporting',
    integrationen: 'Integrationen'
  };

  const featuresByCategory = features.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Feature-Konfiguration</h1>
          <p className="text-sm text-slate-600">Definiere Features und deren Zugriffsbedingungen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFeature(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingFeature ? 'Feature bearbeiten' : 'Neues Feature'}</DialogTitle>
            </DialogHeader>
            <FeatureForm 
              feature={editingFeature}
              plans={plans}
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

      <div className="space-y-4">
        {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">{categoryNames[category]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryFeatures.map(feature => (
                  <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{feature.name}</span>
                        {feature.is_core && (
                          <Badge variant="secondary" className="text-xs">Basis</Badge>
                        )}
                        {feature.requires_plan_level && (
                          <Badge variant="outline" className="text-xs">
                            Min. Level {feature.requires_plan_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingFeature(feature);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
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
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FeatureForm({ feature, plans, onSave, onCancel }) {
  const [formData, setFormData] = useState(feature || {
    key: '',
    name: '',
    description: '',
    category: 'objektverwaltung',
    is_core: false,
    requires_addon: '',
    requires_plan_level: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Feature Key</Label>
        <Input 
          value={formData.key} 
          onChange={e => setFormData({...formData, key: e.target.value})}
          placeholder="banking_import"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Name</Label>
        <Input 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="Banking Import"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Input 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Automatischer Import von Banktransaktionen"
        />
      </div>

      <div className="space-y-2">
        <Label>Kategorie</Label>
        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="objektverwaltung">Objektverwaltung</SelectItem>
            <SelectItem value="mieterverwaltung">Mieterverwaltung</SelectItem>
            <SelectItem value="finanzen">Finanzen</SelectItem>
            <SelectItem value="dokumente">Dokumente</SelectItem>
            <SelectItem value="steuern">Steuern</SelectItem>
            <SelectItem value="kommunikation">Kommunikation</SelectItem>
            <SelectItem value="reporting">Reporting</SelectItem>
            <SelectItem value="integrationen">Integrationen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mindest-Plan Level (optional)</Label>
        <Select 
          value={formData.requires_plan_level ? String(formData.requires_plan_level) : 'none'} 
          onValueChange={v => setFormData({...formData, requires_plan_level: v === 'none' ? null : Number(v)})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein Minimum</SelectItem>
            <SelectItem value="1">Level 1 - Starter</SelectItem>
            <SelectItem value="2">Level 2 - Pro</SelectItem>
            <SelectItem value="3">Level 3 - Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={formData.is_core} 
          onCheckedChange={v => setFormData({...formData, is_core: v})}
        />
        <Label>Basis-Feature (in allen Plänen)</Label>
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