import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, LayoutGrid } from 'lucide-react';

export default function CustomizableDashboard({ category, availableWidgets = [] }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const queryClient = useQueryClient();

  // Fetch dashboard configuration
  const { data: dashboardConfig } = useQuery({
    queryKey: ['dashboardConfig', category],
    queryFn: async () => {
      const config = await base44.entities.DashboardWidget.filter(
        { category: category },
        '-updated_date',
        100
      );
      return config || [];
    }
  });

  // Update dashboard configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig) => {
      // Save or update dashboard widget configuration
      return Promise.all(
        newConfig.map(widget =>
          base44.entities.DashboardWidget.update(widget.id, {
            is_visible: widget.is_visible,
            position: widget.position
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardConfig', category] });
      setIsEditMode(false);
    }
  });

  useEffect(() => {
    if (dashboardConfig) {
      setSelectedWidgets(dashboardConfig.filter(w => w.is_visible !== false));
    }
  }, [dashboardConfig]);

  const handleToggleWidget = (widgetId) => {
    setSelectedWidgets(prev => {
      const isSelected = prev.some(w => w.id === widgetId);
      if (isSelected) {
        return prev.filter(w => w.id !== widgetId);
      } else {
        const widget = availableWidgets.find(w => w.id === widgetId);
        return [...prev, widget];
      }
    });
  };

  const handleSaveConfig = async () => {
    const configToSave = availableWidgets.map((widget, index) => ({
      ...widget,
      is_visible: selectedWidgets.some(w => w.id === widget.id),
      position: selectedWidgets.findIndex(w => w.id === widget.id)
    }));
    await updateConfigMutation.mutateAsync(configToSave);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light">Übersicht</h1>
        <Button
          variant={isEditMode ? 'default' : 'outline'}
          onClick={() => {
            if (isEditMode) {
              handleSaveConfig();
            } else {
              setIsEditMode(true);
            }
          }}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          {isEditMode ? 'Speichern' : 'Anpassen'}
        </Button>
      </div>

      {/* Edit Mode */}
      {isEditMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Verfügbare Widgets</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableWidgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => handleToggleWidget(widget.id)}
                className={`p-3 text-xs rounded border-2 transition-all ${
                  selectedWidgets.some(w => w.id === widget.id)
                    ? 'border-blue-600 bg-blue-100 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {widget.title}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedWidgets.map((widget) => (
          <Card key={widget.id} className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widget.component ? (
                <widget.component />
              ) : (
                <p className="text-xs text-slate-500">Komponente wird geladen...</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWidgets.length === 0 && !isEditMode && (
        <Card className="text-center py-12">
          <p className="text-slate-500">Keine Widgets ausgewählt. Klicken Sie auf "Anpassen", um Widgets hinzuzufügen.</p>
        </Card>
      )}
    </div>
  );
}