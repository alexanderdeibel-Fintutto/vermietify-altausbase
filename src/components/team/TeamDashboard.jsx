import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Activity } from 'lucide-react';

export default function TeamDashboard() {
  const { data: team = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTeamMembers', {});
      return response.data.members;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {team.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{member.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{member.role}</Badge>
                <Activity className="w-3 h-3 text-green-600" />
                <span className="text-xs text-slate-600">Zuletzt aktiv: {member.last_active}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}