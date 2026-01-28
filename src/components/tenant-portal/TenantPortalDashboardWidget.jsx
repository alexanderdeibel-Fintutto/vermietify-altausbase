import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getUnreadCount } from '../services/messaging';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, AlertCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TenantPortalDashboardWidget() {
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages-total'],
    queryFn: getUnreadCount,
    refetchInterval: 15000
  });
  
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: () => base44.entities.TenantInvitation.filter({ status: 'pending' }),
  });
  
  const { data: sharedDocs = [] } = useQuery({
    queryKey: ['shared-docs-count'],
    queryFn: () => base44.entities.TenantPortalDocument.filter({ is_visible: true }),
  });
  
  const { data: openReports = [] } = useQuery({
    queryKey: ['open-damage-reports'],
    queryFn: () => base44.entities.TenantDamageReport.filter({ 
      status: 'reported'
    }),
  });
  
  const stats = [
    { 
      label: 'Ungelesene Nachrichten', 
      value: unreadMessages, 
      icon: MessageSquare, 
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      label: 'Offene Einladungen', 
      value: pendingInvites.length, 
      icon: Users, 
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    { 
      label: 'Geteilte Dokumente', 
      value: sharedDocs.length, 
      icon: FileText, 
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Offene Schadenmeldungen', 
      value: openReports.length, 
      icon: AlertCircle, 
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Mieterportal Übersicht</CardTitle>
          <Link to={createPageUrl('TenantPortalManagement')}>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`${stat.bg} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  {stat.value > 0 && (
                    <Badge className={stat.color.replace('text-', 'bg-').replace('600', '600 text-white')}>
                      {stat.value}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
        
        {unreadMessages > 0 && (
          <div className="mt-4 p-3 bg-blue-600 text-white rounded-lg text-center">
            <p className="text-sm font-medium">
              {unreadMessages} neue Nachricht{unreadMessages > 1 ? 'en' : ''} von Mietern
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}