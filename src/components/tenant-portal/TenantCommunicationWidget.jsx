import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TenantCommunicationWidget({ tenantId, unitId }) {
  // Conversations für diesen Mieter
  const { data: conversations = [] } = useQuery({
    queryKey: ['tenant-conversations', tenantId],
    queryFn: async () => {
      // Hier müssten wir via Supabase filtern, für jetzt verwenden wir Base44 als Fallback
      return base44.entities.TenantConversation.filter({ 
        tenant_id: tenantId 
      });
    },
  });
  
  // Schadenmeldungen
  const { data: damageReports = [] } = useQuery({
    queryKey: ['tenant-damage-reports', unitId],
    queryFn: () => base44.entities.TenantDamageReport.filter({ 
      unit_id: unitId 
    }),
  });
  
  const openConversations = conversations.filter(c => c.status === 'open').length;
  const openDamageReports = damageReports.filter(r => r.status === 'reported').length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mieter-Kommunikation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Offene Chats</span>
            </div>
            <Badge className="bg-blue-600">{openConversations}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">Schadenmeldungen</span>
            </div>
            <Badge className="bg-orange-600">{openDamageReports}</Badge>
          </div>
          
          {conversations.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-600 mb-2">Letzte Aktivität:</p>
              <div className="space-y-2">
                {conversations.slice(0, 2).map(conv => (
                  <div key={conv.id} className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 truncate">
                      {conv.subject}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Link to={createPageUrl('TenantPortalManagement')}>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Zum Mieterportal
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}