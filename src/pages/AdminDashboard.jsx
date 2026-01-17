import React from 'react';
import { VfDashboard } from '@/components/dashboards/VfDashboard';
import MetricsOverview from '@/components/admin/MetricsOverview';
import RecentActivityWidget from '@/components/dashboards/RecentActivityWidget';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminDashboard() {
  return (
    <VfDashboard
      greeting="Admin Dashboard 👨‍💼"
      date={new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    >
      <MetricsOverview />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <RecentActivityWidget />
        
        <div className="space-y-4">
          <Link to={createPageUrl('AdminLeadDashboard')}>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Lead Analytics
            </Button>
          </Link>
          <Link to={createPageUrl('AdminSubscriptionOverview')}>
            <Button variant="outline" className="w-full justify-start">
              💳 Abonnement-Übersicht
            </Button>
          </Link>
          <Link to={createPageUrl('AdminUserManagement')}>
            <Button variant="outline" className="w-full justify-start">
              👥 Benutzer-Verwaltung
            </Button>
          </Link>
          <Link to={createPageUrl('LeadManagement')}>
            <Button variant="outline" className="w-full justify-start">
              🎯 Lead Management
            </Button>
          </Link>
        </div>
      </div>
    </VfDashboard>
  );
}