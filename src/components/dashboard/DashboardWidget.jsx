import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from 'lucide-react';
import QuickStatsWidget from './widgets/QuickStatsWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import OccupancyPieWidget from './widgets/OccupancyPieWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import TasksWidget from './widgets/TasksWidget';
import DocumentsWidget from './widgets/DocumentsWidget';
import ContractsWidget from './widgets/ContractsWidget';

export default function DashboardWidget({ widget, onRemove }) {
  const renderWidgetContent = () => {
    switch (widget.widget_type) {
      case 'quick_stats':
        return <QuickStatsWidget />;
      case 'revenue_chart':
        return <RevenueChartWidget />;
      case 'occupancy_pie':
        return <OccupancyPieWidget />;
      case 'recent_activity':
        return <RecentActivityWidget />;
      case 'tasks':
        return <TasksWidget />;
      case 'documents':
        return <DocumentsWidget />;
      case 'contracts':
        return <ContractsWidget />;
      default:
        return <div>Widget nicht gefunden</div>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
            <CardTitle className="text-base">{widget.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRemove(widget.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
}