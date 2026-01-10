import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Save, Lightbulb, Layout, GripVertical } from 'lucide-react';
import { AVAILABLE_WIDGETS, WIDGET_CATEGORIES, getAccessibleWidgets } from './DashboardWidgetLibrary';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function EnhancedWidgetConfig({ isOpen, onClose, layout, onSave, user }) {
  const [editedLayout, setEditedLayout] = useState(layout);
  const [activeCategory, setActiveCategory] = useState('overview');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { hasModuleAccess } = usePackageAccess();

  // Get accessible widgets based on user permissions
  const accessibleWidgets = getAccessibleWidgets(hasModuleAccess);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['dashboard-templates', user?.role],
    queryFn: async () => {
      const all = await base44.entities.DashboardTemplate.list();
      return all.filter(t => t.target_role === user?.role || t.target_role === 'all');
    },
    enabled: !!user
  });

  // Fetch AI suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['widget-suggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('suggestDashboardWidgets', {});
      return response.data.suggestions || [];
    },
    enabled: showSuggestions
  });

  const toggleWidget = (widgetId) => {
    setEditedLayout(prev => {
      const existing = prev.find(w => w.id === widgetId);
      if (existing) {
        return prev.map(w => 
          w.id === widgetId ? { ...w, enabled: !w.enabled } : w
        );
      } else {
        const widget = accessibleWidgets.find(w => w.id === widgetId);
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(editedLayout);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    // Update order
    const updated = items.map((item, idx) => ({ ...item, order: idx }));
    setEditedLayout(updated);
  };

  const applyTemplate = (template) => {
    setEditedLayout(template.layout);
  };

  const resetToDefault = () => {
    const defaultLayout = accessibleWidgets.slice(0, 7).map((widget, idx) => ({
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
  const filteredWidgets = accessibleWidgets.filter(w => categoryWidgets.includes(w.id));

  const enabledWidgets = editedLayout
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard anpassen</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            KI-Vorschläge {showSuggestions && `(${suggestions?.length || 0})`}
          </Button>
          <Select onValueChange={(val) => applyTemplate(templates.find(t => t.id === val))}>
            <SelectTrigger>
              <Layout className="w-4 h-4 mr-2" />
              Vorlage anwenden
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Standard
          </Button>
        </div>

        {showSuggestions && suggestions && suggestions.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              Empfohlene Widgets
            </h3>
            <div className="space-y-2">
              {suggestions.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{accessibleWidgets.find(w => w.id === s.id)?.name}</p>
                    <p className="text-xs text-slate-600">{s.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => toggleWidget(s.id)}
                    variant={editedLayout.find(w => w.id === s.id && w.enabled) ? 'secondary' : 'default'}
                  >
                    {editedLayout.find(w => w.id === s.id && w.enabled) ? 'Aktiv' : 'Aktivieren'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Available Widgets */}
          <div>
            <h3 className="font-semibold mb-3">Verfügbare Widgets</h3>
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-3 gap-1 mb-4">
                {Object.entries(WIDGET_CATEGORIES).slice(0, 6).map(([key, cat]) => (
                  <TabsTrigger key={key} value={key} className="text-xs">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(WIDGET_CATEGORIES).map(([key]) => (
                <TabsContent key={key} value={key} className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredWidgets.map(widget => {
                    const widgetConfig = editedLayout.find(w => w.id === widget.id);
                    const isEnabled = widgetConfig?.enabled || false;

                    return (
                      <div key={widget.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{widget.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {widget.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{widget.description}</p>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleWidget(widget.id)}
                          />
                        </div>

                        {isEnabled && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Label className="text-xs">Größe:</Label>
                            <Select
                              value={widgetConfig?.size || widget.defaultSize}
                              onValueChange={(size) => changeSize(widget.id, size)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Volle Breite</SelectItem>
                                <SelectItem value="half">Halbe Breite</SelectItem>
                                <SelectItem value="third">Drittel</SelectItem>
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
          </div>

          {/* Right: Active Layout with Drag & Drop */}
          <div>
            <h3 className="font-semibold mb-3">Aktive Widgets (Ziehen zum Sortieren)</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widgets">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 max-h-96 overflow-y-auto"
                  >
                    {enabledWidgets.map((widget, index) => {
                      const widgetInfo = accessibleWidgets.find(w => w.id === widget.id);
                      if (!widgetInfo) return null;

                      return (
                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border rounded-lg p-3 bg-white ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{widgetInfo.name}</p>
                                  <p className="text-xs text-slate-600">
                                    {widget.size === 'full' ? 'Volle Breite' : 
                                     widget.size === 'half' ? 'Halbe Breite' : 'Drittel'}
                                  </p>
                                </div>
                                <Badge variant="outline">{index + 1}</Badge>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {enabledWidgets.length === 0 && (
                      <p className="text-center text-slate-500 py-8">
                        Keine Widgets aktiviert
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}