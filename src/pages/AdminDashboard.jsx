import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  BarChart3, MessageCircle, AlertCircle, FileText, 
  Building2, Users, Settings, TrendingUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminAnalyticsDashboard from '@/components/admin/AdminAnalyticsDashboard';
import UrgentNotificationPanel from '@/components/admin/UrgentNotificationPanel';
import RoleBasedGuard from '@/components/admin/RoleBasedGuard';

export default function AdminDashboard() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-count'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-count'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: unreadThreads = [] } = useQuery({
    queryKey: ['unread-threads-count'],
    queryFn: async () => {
      const threads = await base44.entities.MessageThread.list();
      return threads.filter(t => (t.unread_count_admin || 0) > 0);
    },
    refetchInterval: 10000
  });

  const quickLinks = [
    {
      title: 'Nachrichten',
      description: `${unreadThreads.length} ungelesen`,
      icon: MessageCircle,
      color: 'blue',
      link: 'AdminMessagingCenter'
    },
    {
      title: 'Störungsmeldungen',
      description: 'Probleme verwalten',
      icon: AlertCircle,
      color: 'red',
      link: 'AdminIssueReports'
    },
    {
      title: 'Wissensdatenbank',
      description: 'FAQ bearbeiten',
      icon: FileText,
      color: 'purple',
      link: 'KnowledgeBaseAdmin'
    },
    {
      title: 'Gebäude',
      description: `${buildings.length} Objekte`,
      icon: Building2,
      color: 'green',
      link: 'Buildings'
    },
    {
      title: 'Mieter',
      description: `${tenants.length} aktiv`,
      icon: Users,
      color: 'orange',
      link: 'Tenants'
    },
    {
      title: 'IoT Sensoren',
      description: 'Überwachung',
      icon: TrendingUp,
      color: 'indigo',
      link: 'IoTSensorManagement'
    },
    {
      title: 'Detaillierte Analysen',
      description: 'Statistiken',
      icon: BarChart3,
      color: 'blue',
      link: 'AdminAnalyticsDashboard'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    indigo: 'bg-indigo-600'
  };

  return (
    <RoleBasedGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-600">Zentrale Verwaltungsübersicht</p>
          </div>
        </div>

        {/* Urgent Notifications */}
        <UrgentNotificationPanel />

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {quickLinks.map((link, idx) => (
            <Link key={idx} to={createPageUrl(link.link)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 ${colorClasses[link.color]} rounded-lg flex items-center justify-center mb-3`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{link.title}</p>
                  <p className="text-xs text-slate-600">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kommunikations- & Störungsanalysen</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminAnalyticsDashboard />
          </CardContent>
        </Card>
      </div>
    </RoleBasedGuard>
  );
}