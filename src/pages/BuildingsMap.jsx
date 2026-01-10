import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Home } from 'lucide-react';
import { createPageUrl } from './utils';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function BuildingsMap() {
  const [mapCenter, setMapCenter] = useState([51.1657, 10.4515]); // Germany center
  const [mapZoom, setMapZoom] = useState(6);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-map'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-all'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-all'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  // Filter buildings with valid coordinates
  const buildingsWithCoords = buildings.filter(b => b.latitude && b.longitude);

  useEffect(() => {
    if (buildingsWithCoords.length > 0) {
      // Calculate center of all buildings
      const avgLat = buildingsWithCoords.reduce((sum, b) => sum + parseFloat(b.latitude), 0) / buildingsWithCoords.length;
      const avgLng = buildingsWithCoords.reduce((sum, b) => sum + parseFloat(b.longitude), 0) / buildingsWithCoords.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(buildingsWithCoords.length === 1 ? 13 : 10);
    }
  }, [buildingsWithCoords.length]);

  const getBuildingStats = (buildingId) => {
    const buildingUnits = units.filter(u => u.building_id === buildingId);
    const activeContracts = contracts.filter(c => 
      buildingUnits.some(u => u.id === c.unit_id) && c.status === 'active'
    );
    return {
      totalUnits: buildingUnits.length,
      occupiedUnits: activeContracts.length,
      occupancyRate: buildingUnits.length > 0 
        ? ((activeContracts.length / buildingUnits.length) * 100).toFixed(0)
        : 0
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Gebäude-Übersichtskarte</h1>
          <p className="text-slate-600">Standorte aller Ihrer Gebäude auf einen Blick</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Building List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Gebäude ({buildingsWithCoords.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
            {buildingsWithCoords.map((building) => {
              const stats = getBuildingStats(building.id);
              return (
                <Link
                  key={building.id}
                  to={createPageUrl('BuildingDetail') + `?id=${building.id}`}
                  className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {building.name}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {building.street} {building.house_number}, {building.city}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Home className="w-3 h-3 mr-1" />
                          {stats.totalUnits} Einheiten
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            stats.occupancyRate >= 90 ? 'bg-green-50 text-green-700' :
                            stats.occupancyRate >= 70 ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                          }`}
                        >
                          {stats.occupancyRate}% Auslastung
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {buildingsWithCoords.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                Keine Gebäude mit Koordinaten gefunden
              </p>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="h-[600px] rounded-lg overflow-hidden">
              {buildingsWithCoords.length > 0 ? (
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {buildingsWithCoords.map((building) => {
                    const stats = getBuildingStats(building.id);
                    return (
                      <Marker
                        key={building.id}
                        position={[parseFloat(building.latitude), parseFloat(building.longitude)]}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {building.name}
                            </h3>
                            <p className="text-sm text-slate-600 mb-2">
                              {building.street} {building.house_number}<br />
                              {building.postal_code} {building.city}
                            </p>
                            <div className="space-y-1 mb-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Einheiten:</span>
                                <span className="font-medium">{stats.totalUnits}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Belegt:</span>
                                <span className="font-medium">{stats.occupiedUnits}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Auslastung:</span>
                                <span className="font-medium">{stats.occupancyRate}%</span>
                              </div>
                            </div>
                            <Link to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
                              <Button size="sm" className="w-full">
                                Details anzeigen
                              </Button>
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Keine Gebäude auf der Karte</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Fügen Sie Koordinaten zu Ihren Gebäuden hinzu
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}