import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Phone, Mail, Home, Search } from 'lucide-react';

export default function TenantQuickView({ buildingId }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: contracts = [] } = useQuery({
    queryKey: ['activeContracts', buildingId],
    queryFn: async () => {
      const allContracts = await base44.entities.LeaseContract.filter(
        { status: 'active' },
        '-start_date',
        100
      );

      if (!buildingId) return allContracts;

      const units = await base44.entities.Unit.filter({ building_id: buildingId }, null, 100);
      return allContracts.filter(c => units.find(u => u.id === c.unit_id));
    }
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(null, 200),
    enabled: contracts.length > 0
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => base44.entities.Unit.filter(
      buildingId ? { building_id: buildingId } : {},
      'unit_number',
      100
    )
  });

  const enrichedContracts = contracts.map(contract => ({
    ...contract,
    tenant: tenants.find(t => t.id === contract.tenant_id),
    unit: units.find(u => u.id === contract.unit_id)
  })).filter(c => c.tenant && c.unit);

  const filteredContracts = searchTerm
    ? enrichedContracts.filter(c => 
        c.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.unit?.unit_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : enrichedContracts;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Mieter oder Wohnung suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tenant List */}
      <div className="space-y-3">
        {filteredContracts.map(contract => (
          <Card key={contract.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-bold text-base">
                    {contract.tenant.first_name} {contract.tenant.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Home className="w-3 h-3 text-slate-500" />
                    <p className="text-sm text-slate-600">{contract.unit.unit_number}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
              </div>

              <div className="space-y-2">
                {contract.tenant.phone && (
                  <a href={`tel:${contract.tenant.phone}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="w-3 h-3 mr-2" />
                      {contract.tenant.phone}
                    </Button>
                  </a>
                )}
                {contract.tenant.email && (
                  <a href={`mailto:${contract.tenant.email}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Mail className="w-3 h-3 mr-2" />
                      {contract.tenant.email}
                    </Button>
                  </a>
                )}
              </div>

              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-600">Miete</p>
                  <p className="font-semibold">{contract.total_rent?.toLocaleString('de-DE')} €</p>
                </div>
                <div>
                  <p className="text-slate-600">Einzug</p>
                  <p className="font-semibold">
                    {new Date(contract.start_date).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredContracts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-slate-600">
              Keine Mieter gefunden
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}