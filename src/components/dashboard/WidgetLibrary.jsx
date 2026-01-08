import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

const availableWidgets = [
  { type: 'quick_stats', name: 'Schnellstatistiken', icon: '📊', defaultSize: { w: 4, h: 2 } },
  { type: 'revenue_chart', name: 'Umsatz-Chart', icon: '💰', defaultSize: { w: 6, h: 4 } },
  { type: 'occupancy_pie', name: 'Auslastung', icon: '🏠', defaultSize: { w: 4, h: 3 } },
  { type: 'recent_activity', name: 'Aktivität', icon: '📋', defaultSize: { w: 6, h: 3 } },
  { type: 'tasks', name: 'Aufgaben', icon: '✅', defaultSize: { w: 4, h: 3 } },
  { type: 'documents', name: 'Dokumente', icon: '📄', defaultSize: { w: 4, h: 3 } },
  { type: 'contracts', name: 'Verträge', icon: '📝', defaultSize: { w: 4, h: 3 } }
];

export default function WidgetLibrary({ onAddWidget }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget-Bibliothek</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {availableWidgets.map((widget) => (
            <Button
              key={widget.type}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => onAddWidget(widget)}
            >
              <span className="text-2xl">{widget.icon}</span>
              <span className="text-sm">{widget.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { availableWidgets };