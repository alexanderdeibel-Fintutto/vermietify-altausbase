import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Wrench, Shield, Leaf } from 'lucide-react';

export default function ServiceProviderDirectory({ companyId }) {
  const { data: providers = [] } = useQuery({
    queryKey: ['service-providers', companyId],
    queryFn: () => base44.asServiceRole.entities.ServiceProvider.filter({ company_id: companyId })
  });

  const getProviderIcon = (type) => {
    switch (type) {
      case 'handwerker': return <Wrench className="w-4 h-4" />;
      case 'insurance': return <Shield className="w-4 h-4" />;
      case 'garden': return <Leaf className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Service-Marketplace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {providers.map(provider => (
          <div key={provider.id} className="p-3 border rounded hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getProviderIcon(provider.provider_type)}
                <span className="text-sm font-medium">{provider.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs">{provider.rating}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {provider.services?.slice(0, 3).map((service, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{provider.contact_phone}</span>
              <Badge className={provider.verified ? 'bg-green-100 text-green-700' : ''}>
                {provider.verified ? 'Verifiziert' : 'Nicht verifiziert'}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}