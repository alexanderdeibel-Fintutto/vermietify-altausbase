import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { LayoutGrid, Plus, Save, Edit2 } from 'lucide-react';

const AVAILABLE_WIDGETS = [
  { id: 'execution-timeline', name: 'Ausführungs-Zeitleiste', description: 'Zeigt Ausführungen über Zeit' },
  { id: 'status-distribution', name: 'Status-Verteilung', description: 'Pie-Chart mit Status' },
  { id: 'step-completion', name: 'Schritt-Abschlussraten', description: 'Bar-Chart für Schritte' },
  { id: 'approval-bottlenecks', name: 'Genehmigungsengpässe', description: 'Pending Approvals' },
  { id: 'key-metrics', name: 'Wichtigste Metriken', description: 'KPI Karten' },
  { id: 'predictions', name: 'Workflow-Prognosen', description: 'Prognosen für laufende Workflows' }
];

export default function CustomDashboardBuilder({ companyId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    widgets: []
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: dashboards = [] } = useQuery({
    queryKey: ['custom-dashboards', companyId, user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.asServiceRole.entities.DashboardConfig.filter({
        company_id: companyId,
        user_email: user.email
      });
      return result;
    },
    enabled: !!user?.email
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return base44.asServiceRole.entities.DashboardConfig.update(editingId, {
          name: formData.name,
          description: formData.description,
          widgets: formData.widgets.map((w, idx) => ({
            id: w,
            type: w,
            position: { x: idx * 300, y: 0, width: 400, height: 300 },
            config: {}
          }))
        });
      } else {
        return base44.asServiceRole.entities.DashboardConfig.create({
          company_id: companyId,
          user_email: user.email,
          name: formData.name,
          description: formData.description,
          widgets: formData.widgets.map((w, idx) => ({
            id: w,
            type: w,
            position: { x: idx * 300, y: 0, width: 400, height: 300 },
            config: {}
          }))
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      setShowDialog(false);
      setFormData({ name: '', description: '', widgets: [] });
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.DashboardConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
    }
  });

  const handleEdit = (dashboard) => {
    setEditingId(dashboard.id);
    setFormData({
      name: dashboard.name,
      description: dashboard.description,
      widgets: dashboard.widgets?.map(w => w.type) || []
    });
    setShowDialog(true);
  };

  const toggleWidget = (widgetId) => {
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.includes(widgetId)
        ? prev.widgets.filter(w => w !== widgetId)
        : [...prev.widgets, widgetId]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" />
          Benutzerdefinierte Dashboards
        </h3>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', widgets: [] });
            setShowDialog(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Dashboard
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Dashboard bearbeiten' : 'Neues Dashboard erstellen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dashboard-Name"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional"
                className="mt-1 h-16"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Widgets auswählen</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {AVAILABLE_WIDGETS.map(widget => (
                  <label key={widget.id} className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <Checkbox
                      checked={formData.widgets.includes(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{widget.name}</p>
                      <p className="text-xs text-slate-600">{widget.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!formData.name || formData.widgets.length === 0 || saveMutation.isPending}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboards List */}
      <div className="space-y-2">
        {dashboards.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Dashboards vorhanden
            </CardContent>
          </Card>
        ) : (
          dashboards.map(dashboard => (
            <Card key={dashboard.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{dashboard.name}</h4>
                    {dashboard.description && (
                      <p className="text-sm text-slate-600 mt-1">{dashboard.description}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-2">
                      {dashboard.widgets?.length || 0} Widgets
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(dashboard)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(dashboard.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}