import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, MapPin, Phone, Mail, AlertCircle, Calendar } from 'lucide-react';

export default function MobileBuildingInfo({ tenantId }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantContracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }, '-start_date', 5),
    enabled: !!tenantId
  });

  const { data: building } = useQuery({
    queryKey: ['tenantBuilding', contracts[0]?.building_id],
    queryFn: async () => {
      const buildings = await base44.entities.Building.filter({ id: contracts[0].building_id }, null, 1);
      return buildings[0];
    },
    enabled: !!contracts[0]?.building_id
  });

  const { data: boardPosts = [] } = useQuery({
    queryKey: ['buildingBoard', building?.id],
    queryFn: () => base44.entities.BuildingBoardPost.filter({ 
      building_id: building.id,
      is_published: true 
    }, '-created_date', 10),
    enabled: !!building?.id
  });

  if (!building) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-600">
          Keine Gebäudeinformationen verfügbar
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Building Info Card */}
      <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{building.name}</h2>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4" />
                <span>{building.address}, {building.postal_code} {building.city}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
            {building.baujahr && (
              <div>
                <p className="text-xs text-slate-300">Baujahr</p>
                <p className="font-semibold">{building.baujahr}</p>
              </div>
            )}
            {building.anzahl_einheiten && (
              <div>
                <p className="text-xs text-slate-300">Einheiten</p>
                <p className="font-semibold">{building.anzahl_einheiten}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kontakt Hausverwaltung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {building.contact_email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-600">E-Mail</p>
                <a href={`mailto:${building.contact_email}`} className="text-sm font-semibold text-blue-600">
                  {building.contact_email}
                </a>
              </div>
            </div>
          )}
          {building.contact_phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-slate-600">Telefon</p>
                <a href={`tel:${building.contact_phone}`} className="text-sm font-semibold text-green-600">
                  {building.contact_phone}
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Building Board Posts */}
      {boardPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aushang & Mitteilungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {boardPosts.map(post => (
              <div key={post.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{post.title}</h4>
                  {post.priority === 'urgent' && (
                    <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Dringend
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 line-clamp-3">{post.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.created_date).toLocaleDateString('de-DE')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}