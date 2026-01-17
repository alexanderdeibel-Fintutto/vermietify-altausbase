import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import QuickStatsWidget from './widgets/QuickStatsWidget';
import BuildingsWidget from './widgets/BuildingsWidget';
import TenantsWidget from './widgets/TenantsWidget';
import ContractsWidget from './widgets/ContractsWidget';
import DocumentsWidget from './widgets/DocumentsWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import OccupancyWidget from './widgets/OccupancyWidget';

export default function CustomizableDashboard() {
  const [layout, setLayout] = useState([
    'stats', 'buildings', 'tenants', 'contracts', 'documents', 'revenue', 'occupancy'
  ]);

  const widgetMap = {
    stats: <QuickStatsWidget />,
    buildings: <BuildingsWidget />,
    tenants: <TenantsWidget />,
    contracts: <ContractsWidget />,
    documents: <DocumentsWidget />,
    revenue: <RevenueChartWidget />,
    occupancy: <OccupancyWidget />
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Anpassen
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {layout.map((widgetKey) => (
          <div key={widgetKey}>
            {widgetMap[widgetKey]}
          </div>
        ))}
      </div>
    </div>
  );
}