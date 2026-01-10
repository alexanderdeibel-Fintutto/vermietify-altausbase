import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical } from 'lucide-react';

const AVAILABLE_WIDGETS = [
  {
    id: 'assigned_tasks',
    name: 'Meine Aufgaben',
    description: 'Zeigt zugewiesene Aufgaben an',
    category: 'productivity'
  },
  {
    id: 'pending_approvals',
    name: 'Ausstehende Genehmigungen',
    description: 'Workflows die Genehmigung benötigen',
    category: 'workflow'
  },
  {
    id: 'workflow_status',
    name: 'Workflow-Status',
    description: 'Übersicht laufender Workflows',
    category: 'workflow'
  },
  {
    id: 'notifications',
    name: 'Benachrichtigungen',
    description: 'Letzte Benachrichtigungen',
    category: 'notifications'
  },
  {
    id: 'quick_stats',
    name: 'Schnellstatistiken',
    description: 'Wichtige Metriken',
    category: 'overview'
  }
];

export default function DashboardCustomizer({ onClose, onSave, enabledWidgets = [] }) {
  const [selectedWidgets, setSelectedWidgets] = useState(enabledWidgets);
  const queryClient = useQueryClient();

  const { data: user } = React.useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) return;

      const preferences = await base44.asServiceRole.entities.UserPreferences.filter({
        user_email: user.email
      });

      if (preferences[0]) {
        return base44.asServiceRole.entities.UserPreferences.update(preferences[0].id, {
          dashboard_widgets: selectedWidgets
        });
      } else {
        return base44.asServiceRole.entities.UserPreferences.create({
          user_email: user.email,
          dashboard_widgets: selectedWidgets
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      onSave(selectedWidgets);
    }
  });

  const toggleWidget = (widgetId) => {
    setSelectedWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const categories = {
    productivity: 'Produktivität',
    workflow: 'Workflows',
    notifications: 'Benachrichtigungen',
    overview: 'Übersicht'
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard anpassen</DialogTitle>
          <DialogDescription>
            Wählen Sie die Widgets aus, die auf Ihrem Dashboard angezeigt werden sollen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(categories).map(([catKey, catName]) => (
            <div key={catKey}>
              <h4 className="text-sm font-medium text-slate-900 mb-2">{catName}</h4>
              <div className="space-y-2">
                {AVAILABLE_WIDGETS.filter(w => w.category === catKey).map(widget => (
                  <label
                    key={widget.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedWidgets.includes(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{widget.name}</p>
                      <p className="text-xs text-slate-600">{widget.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex-1"
          >
            {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}