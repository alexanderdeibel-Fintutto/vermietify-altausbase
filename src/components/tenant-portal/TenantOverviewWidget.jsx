import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { getMyConversations } from '../services/messaging';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TenantOverviewWidget() {
  // Aktive Mietverträge
  const { data: activeContracts = [] } = useQuery({
    queryKey: ['active-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_active_leases')
        .select('*')
        .eq('vertragsstatus', 'Aktiv');
      if (error) throw error;
      return data;
    },
  });
  
  // Ungelesene Conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-unread'],
    queryFn: getMyConversations,
  });
  
  // Offene Schadenmeldungen
  const { data: damageReports = [] } = useQuery({
    queryKey: ['damage-reports-open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_maintenance_tasks')
        .select('*')
        .eq('kategorie', 'Reparatur')
        .eq('status', 'Offen');
      if (error) throw error;
      return data;
    },
  });
  
  // Freigegebene Dokumente
  const { data: sharedDocs = [] } = useQuery({
    queryKey: ['shared-docs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('TenantPortalDocument')
        .select('*')
        .eq('is_visible', true);
      if (error) throw error;
      return data;
    },
  });
  
  const unreadCount = conversations.reduce((sum, c) => 
    sum + (c.conversation_members?.[0]?.unread_count || 0), 0
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Mieterportal Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{activeContracts.length}</div>
            <div className="text-sm text-gray-600">Aktive Mieter</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg relative">
            <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-sm text-gray-600">Ungelesene</div>
            {unreadCount > 0 && (
              <Badge className="absolute top-2 right-2 bg-red-600">Neu</Badge>
            )}
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{sharedDocs.length}</div>
            <div className="text-sm text-gray-600">Dokumente</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{damageReports.length}</div>
            <div className="text-sm text-gray-600">Offene Schäden</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Link to={createPageUrl('TenantPortalManagement')}>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Nachrichten & Chat
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          
          <Link to={createPageUrl('TenantPortalManagement')}>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Dokumente verwalten
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          
          <Link to={createPageUrl('TenantPortalManagement')}>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Schadenmeldungen
              </span>
              {damageReports.length > 0 && (
                <Badge className="bg-red-600">{damageReports.length}</Badge>
              )}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}