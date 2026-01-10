import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OnboardingsWidget() {
  const { data: onboardings = [] } = useQuery({
    queryKey: ['active-onboardings'],
    queryFn: async () => {
      const all = await base44.entities.TenantOnboarding.list('-created_date', 50);
      return all.filter(o => o.status !== 'completed');
    }
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-widget'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Aktive Onboardings
          </CardTitle>
          {onboardings.length > 0 && (
            <Badge variant="secondary">{onboardings.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {onboardings.length > 0 ? (
          <div className="space-y-3">
            {onboardings.slice(0, 4).map((onboarding) => (
              <div key={onboarding.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{getTenantName(onboarding.tenant_id)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                      <div 
                        className="h-full bg-blue-600"
                        style={{ width: `${onboarding.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">{onboarding.progress_percentage}%</span>
                  </div>
                </div>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine aktiven Onboardings
          </p>
        )}

        {onboardings.length > 0 && (
          <Link to={createPageUrl('TenantOnboardingManager')}>
            <p className="text-sm text-blue-600 hover:underline text-center pt-3">
              Alle anzeigen →
            </p>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}