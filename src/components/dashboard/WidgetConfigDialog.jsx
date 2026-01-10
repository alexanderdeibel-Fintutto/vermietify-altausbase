import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Save } from 'lucide-react';

const WIDGET_INFO = {
  'quick-stats': { name: 'Schnellübersicht', description: 'Wichtige Kennzahlen auf einen Blick' },
  'budget': { name: 'Budget-Übersicht', description: 'Aktuelle Budgets und Auslastung' },
  'forecast': { name: 'Finanzprognose', description: 'Prognose der nächsten 3 Monate' },
  'tasks': { name: 'Offene Aufgaben', description: 'Zu erledigende Aufgaben und Workflows' },
  'activities': { name: 'Aktivitäten', description: 'Letzte Aktivitäten im System' },
  'notifications': { name: 'Benachrichtigungen', description: 'Kritische Meldungen' },
  'documents': { name: 'Dokumente', description: 'Zu prüfende Dokumentenanalysen' }
};

export default function WidgetConfigDialog({ isOpen, onClose, layout, onSave }) {
  const [localLayout, setLocalLayout] = useState(layout);

  const handleToggle = (widgetId) => {
    setLocalLayout(prev => prev.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const handleSizeChange = (widgetId, size) => {
    setLocalLayout(prev => prev.map(w => 
      w.id === widgetId ? { ...w, size } : w
    ));
  };

  const handleSave = () => {
    onSave(localLayout);
    onClose();
  };

  const handleReset = () => {
    const defaultLayout = [
      { id: 'quick-stats', component: 'QuickStatsWidget', size: 'full', order: 0, enabled: true },
      { id: 'budget', component: 'BudgetOverviewWidget', size: 'half', order: 1, enabled: true },
      { id: 'forecast', component: 'FinancialForecastWidget', size: 'half', order: 2, enabled: true },
      { id: 'tasks', component: 'OpenTasksWidget', size: 'half', order: 3, enabled: true },
      { id: 'activities', component: 'RecentActivitiesWidget', size: 'half', order: 4, enabled: true },
      { id: 'notifications', component: 'CriticalNotificationsWidget', size: 'half', order: 5, enabled: true },
      { id: 'documents', component: 'DocumentAnalysisWidget', size: 'half', order: 6, enabled: true }
    ];
    setLocalLayout(defaultLayout);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Widgets anpassen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {localLayout
            .sort((a, b) => a.order - b.order)
            .map((widget) => {
              const info = WIDGET_INFO[widget.id];
              return (
                <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{info.name}</p>
                    <p className="text-xs text-slate-600">{info.description}</p>
                  </div>

                  <Select
                    value={widget.size}
                    onValueChange={(size) => handleSizeChange(widget.id, size)}
                    disabled={!widget.enabled}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Volle Breite</SelectItem>
                      <SelectItem value="half">Halbe Breite</SelectItem>
                      <SelectItem value="third">1/3 Breite</SelectItem>
                    </SelectContent>
                  </Select>

                  <Switch
                    checked={widget.enabled}
                    onCheckedChange={() => handleToggle(widget.id)}
                  />
                </div>
              );
            })}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Zurücksetzen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}