import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertCircle, Info } from 'lucide-react';

export default function TenantAnnouncementFeed({ tenantId, buildingId }) {
  const { data: announcements = [] } = useQuery({
    queryKey: ['tenant-announcements', tenantId, buildingId],
    queryFn: async () => {
      const allTenants = await base44.entities.Announcement.filter({ 
        target_audience: 'all_tenants'
      }, '-published_at', 10);
      
      const buildingSpecific = buildingId ? await base44.entities.Announcement.filter({
        target_audience: 'specific_building',
        building_id: buildingId
      }, '-published_at', 10) : [];

      return [...allTenants, ...buildingSpecific].sort((a, b) => 
        new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date)
      );
    }
  });

  const getIcon = (type) => {
    switch(type) {
      case 'emergency': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Megaphone className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-3">
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Keine aktuellen Ankündigungen</p>
          </CardContent>
        </Card>
      ) : (
        announcements.map(ann => (
          <Card key={ann.id} className={`border ${getColor(ann.priority)}`}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {getIcon(ann.announcement_type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{ann.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {ann.announcement_type === 'emergency' ? 'Dringend' : 
                       ann.announcement_type === 'maintenance' ? 'Wartung' :
                       ann.announcement_type === 'event' ? 'Event' : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{ann.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(ann.published_at || ann.created_date).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}