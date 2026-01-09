import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Layout, Settings } from 'lucide-react';
import PortfolioOverviewWidget from '@/components/dashboard/widgets/PortfolioOverviewWidget';
import OccupancyWidget from '@/components/dashboard/widgets/OccupancyWidget';
import RevenueWidget from '@/components/dashboard/widgets/RevenueWidget';
import UpcomingTasksWidget from '@/components/dashboard/widgets/UpcomingTasksWidget';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';
import DocumentInboxDashboardWidget from '@/components/documentInbox/DocumentInboxDashboardWidget';

export default function Dashboard() {
  const [editMode, setEditMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('real_estate');
  const queryClient = useQueryClient();

  const { data: dashboardConfig } = useQuery({
    queryKey: ['dashboardConfig', activeCategory],
    queryFn: async () => {
      const configs = await base44.entities.DashboardWidget.filter({
        category: activeCategory,
        is_visible: true
      }, '-position');
      return configs;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light">Übersicht</h1>
          <p className="text-slate-500 mt-1">Ihr personalisiertes Dashboard</p>
        </div>
        <Button
          variant={editMode ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => setEditMode(!editMode)}
        >
          <Layout className="w-4 h-4" />
          {editMode ? 'Fertig' : 'Anpassen'}
        </Button>
      </div>

      {/* Edit Mode */}
      {editMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 Sie können Widgets hier anordnen und ihre Sichtbarkeit anpassen. Ziehen Sie diese um zu verschieben.
          </p>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {['real_estate', 'tenants', 'private'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm font-light transition-colors ${
              activeCategory === cat
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {cat === 'real_estate' && '🏢 Immobilien'}
            {cat === 'tenants' && '👥 Mieter'}
            {cat === 'private' && '👤 Privat'}
          </button>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-3 gap-6 auto-rows-max">
        {activeCategory === 'real_estate' && (
          <>
            <PortfolioOverviewWidget />
            <OccupancyWidget />
            <RevenueWidget />
            <UpcomingTasksWidget />
            <DocumentInboxDashboardWidget />
          </>
        )}
        
        {activeCategory === 'tenants' && (
          <>
            <div className="col-span-3 bg-slate-100 rounded-lg p-8 text-center text-slate-600">
              <p>Mieter-Dashboard wird noch vorbereitet...</p>
            </div>
          </>
        )}
        
        {activeCategory === 'private' && (
          <>
            <div className="col-span-3 bg-slate-100 rounded-lg p-8 text-center text-slate-600">
              <p>Privates Dashboard wird noch vorbereitet...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}