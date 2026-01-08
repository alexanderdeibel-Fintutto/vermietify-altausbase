import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PackageManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    package_type: '',
    package_name: '',
    base_price: 0,
    included_modules: []
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['package-templates'],
    queryFn: () => base44.asServiceRole.entities.PackageTemplate.list()
  });

  const { data: userConfigs = [] } = useQuery({
    queryKey: ['user-package-configs'],
    queryFn: () => base44.asServiceRole.entities.UserPackageConfiguration.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.asServiceRole.entities.PackageTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-templates'] });
      setFormData({ package_type: '', package_name: '', base_price: 0, included_modules: [] });
      toast.success('Paket erstellt');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.asServiceRole.entities.PackageTemplate.update(editingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-templates'] });
      setEditingId(null);
      toast.success('Paket aktualisiert');
    }
  });

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const packageStats = {
    easyKonto: userConfigs.filter(c => c.package_type === 'easyKonto').length,
    easySteuer: userConfigs.filter(c => c.package_type === 'easySteuer').length,
    easyHome: userConfigs.filter(c => c.package_type === 'easyHome').length,
    easyVermieter: userConfigs.filter(c => c.package_type === 'easyVermieter').length,
    easyGewerbe: userConfigs.filter(c => c.package_type === 'easyGewerbe').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📦 Paketverwalter</h1>
        <p className="text-slate-600 mt-1">Admin-Interface zum Verwalten von Paket-Templates</p>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Pakete</TabsTrigger>
          <TabsTrigger value="users">Benutzer-Zuordnungen</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          {/* Paket-Verwaltung */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingId ? 'Paket bearbeiten' : 'Neues Paket'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="text"
                  placeholder="Paket-Typ (z.B. easyKonto)"
                  value={formData.package_type}
                  onChange={(e) => setFormData({...formData, package_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Anzeigename"
                  value={formData.package_name}
                  onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Monatlicher Preis"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="Module (kommagetrennt)"
                  value={formData.included_modules?.join(', ')}
                  onChange={(e) => setFormData({...formData, included_modules: e.target.value.split(',').map(m => m.trim())})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                  {editingId && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Liste */}
            <div className="space-y-3">
              <p className="font-medium">Vorhandene Pakete</p>
              {templates.map(template => (
                <Card key={template.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{template.package_name}</p>
                        <p className="text-sm text-slate-600">€{template.base_price}/Monat</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.included_modules?.slice(0, 3).map(m => (
                            <Badge key={m} variant="outline" className="text-xs">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(template.id);
                            setFormData(template);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Benutzer nach Paket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(packageStats).map(([packageType, count]) => (
                <div key={packageType} className="flex items-center justify-between p-3 border rounded-lg">
                  <p className="font-medium">{packageType}</p>
                  <Badge className="bg-blue-100 text-blue-800">
                    {count} Benutzer
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paket-Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Gesamt Benutzer</p>
                  <p className="text-2xl font-bold">{userConfigs.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Mit Add-ons</p>
                  <p className="text-2xl font-bold">
                    {userConfigs.filter(c => c.additional_modules?.length > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}