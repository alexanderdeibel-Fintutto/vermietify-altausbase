import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

export default function DashboardBuilder() {
  const queryClient = useQueryClient();

  const { data: widgets = [] } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDashboardWidgets', {});
      return response.data.widgets;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (newWidgets) => {
      await base44.functions.invoke('saveDashboardWidgets', { widgets: newWidgets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Dashboard gespeichert');
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgets);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    saveMutation.mutate(items);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard anpassen</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {widgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="flex-1 text-sm font-semibold">{widget.name}</span>
                        <Button size="icon" variant="ghost">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}