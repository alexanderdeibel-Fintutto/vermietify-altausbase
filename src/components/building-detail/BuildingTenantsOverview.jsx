import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingTenantsOverview({ tenants, contracts }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-light text-slate-900">Mieter in diesem Gebäude</h2>
      
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Keine Mieter vorhanden
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map(tenant => {
            const tenantContract = contracts.find(c => c.tenant_id === tenant.id && c.status === 'active');
            
            return (
              <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{tenant.full_name}</h3>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {tenant.email}
                        </p>
                        {tenant.phone && (
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {tenant.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {tenantContract && (
                      <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                    )}
                  </div>

                  {tenantContract && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                      <div>Miete: <span className="font-semibold">{tenantContract.total_rent}€</span></div>
                      <div>Seit: <span className="font-semibold">{new Date(tenantContract.start_date).toLocaleDateString('de-DE')}</span></div>
                    </div>
                  )}

                  <Link to={createPageUrl('TenantDetail') + `?id=${tenant.id}`}>
                    <Button size="sm" variant="outline" className="w-full">
                      <Eye className="w-3 h-3 mr-1" />
                      Details ansehen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}