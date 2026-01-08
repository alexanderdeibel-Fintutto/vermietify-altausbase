import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import WidgetLibrary, { availableWidgets } from '@/components/dashboard/WidgetLibrary';

export default function CustomDashboard() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: widgets = [] } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.DashboardWidget.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const createWidgetMutation = useMutation({
    mutationFn: (data) => base44.entities.DashboardWidget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      toast.success('Widget hinzugefügt');
      setLibraryOpen(false);
    }
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: (id) => base44.entities.DashboardWidget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      toast.success('Widget entfernt');
    }
  });

  const handleAddWidget = (widgetTemplate) => {
    if (!user) return;

    const newWidget = {
      user_id: user.id,
      widget_type: widgetTemplate.type,
      title: widgetTemplate.name,
      position: {
        x: 0,
        y: widgets.length * 3,
        w: widgetTemplate.defaultSize.w,
        h: widgetTemplate.defaultSize.h
      },
      is_visible: true
    };

    createWidgetMutation.mutate(newWidget);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mein Dashboard</h1>
          <p className="text-slate-600">Personalisierbare Widget-Ansicht</p>
        </div>
        <Button onClick={() => setLibraryOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Widget hinzufügen
        </Button>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Settings className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Noch keine Widgets</h3>
          <p className="text-slate-600 mb-4">Fügen Sie Widgets hinzu, um Ihr Dashboard zu personalisieren</p>
          <Button onClick={() => setLibraryOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Widget hinzufügen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} style={{ gridColumn: `span ${widget.position.w / 3}` }}>
              <DashboardWidget
                widget={widget}
                onRemove={(id) => deleteWidgetMutation.mutate(id)}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Widget hinzufügen</DialogTitle>
          </DialogHeader>
          <WidgetLibrary onAddWidget={handleAddWidget} />
        </DialogContent>
      </Dialog>
    </div>
  );
}