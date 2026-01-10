import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Save, Check } from 'lucide-react';
import { AVAILABLE_WIDGETS, WIDGET_CATEGORIES } from './DashboardWidgetLibrary';

export default function EnhancedWidgetConfig({ isOpen, onClose, layout, onSave }) {
  const [editedLayout, setEditedLayout] = useState(layout);
  const [activeCategory, setActiveCategory] = useState('overview');

  const toggleWidget = (widgetId) => {
    setEditedLayout(prev => {
      const existing = prev.find(w => w.id === widgetId);
      if (existing) {
        return prev.map(w => 
          w.id === widgetId ? { ...w, enabled: !w.enabled } : w
        );
      } else {
        const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
        return [...prev, {
          id: widgetId,
          component: widget.component,
          size: widget.defaultSize,
          order: prev.length,
          enabled: true
        }];
      }
    });
  };

  const changeSize = (widgetId, size) => {
    setEditedLayout(prev =>
      prev.map(w => w.id === widgetId ? { ...w, size } : w)
    );
  };

  const resetToDefault = () => {
    const defaultLayout = AVAILABLE_WIDGETS.slice(0, 7).map((widget, idx) => ({
      id: widget.id,
      component: widget.component,
      size: widget.defaultSize,
      order: idx,
      enabled: true
    }));
    setEditedLayout(defaultLayout);
  };

  const handleSave = () => {
    onSave(editedLayout);
    onClose();
  };

  const categoryWidgets = WIDGET_CATEGORIES[activeCategory]?.widgets || [];
  const filteredWidgets = AVAILABLE_WIDGETS.filter(w => categoryWidgets.includes(w.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard anpassen</DialogTitle>
        </DialogHeader>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-1">
            {Object.entries(WIDGET_CATEGORIES).map(([key, cat]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(WIDGET_CATEGORIES).map(([key]) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              {filteredWidgets.map(widget => {
                const widgetConfig = editedLayout.find(w => w.id === widget.id);
                const isEnabled = widgetConfig?.enabled || false;

                return (
                  <div key={widget.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{widget.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {widget.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{widget.description}</p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                    </div>

                    {isEnabled && (
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Label className="text-sm">Größe:</Label>
                        <Select
                          value={widgetConfig?.size || widget.defaultSize}
                          onValueChange={(size) => changeSize(widget.id, size)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Volle Breite</SelectItem>
                            <SelectItem value="half">Halbe Breite</SelectItem>
                            <SelectItem value="third">Drittel Breite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-2" />
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