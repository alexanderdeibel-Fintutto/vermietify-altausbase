import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Navigation, MapPin } from 'lucide-react';

export default function GPSNavigation({ buildingId }) {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const building = buildingId ? buildings.find(b => b.id === buildingId) : null;

  const openMaps = (address) => {
    const encoded = encodeURIComponent(address);
    // Check if iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.location.href = `maps://maps.google.com/maps?daddr=${encoded}`;
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {building ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold mb-2">{building.name}</p>
            <p className="text-sm text-slate-600 mb-3">
              {building.street} {building.house_number}<br />
              {building.postal_code} {building.city}
            </p>
            <Button
              onClick={() => openMaps(`${building.street} ${building.house_number}, ${building.postal_code} ${building.city}`)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigation starten
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {buildings.slice(0, 5).map(b => (
              <button
                key={b.id}
                onClick={() => openMaps(`${b.street} ${b.house_number}, ${b.postal_code} ${b.city}`)}
                className="w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs text-slate-600">
                      {b.street} {b.house_number}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}