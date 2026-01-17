import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingCard({ building, unitCount = 0, occupancyRate = 0 }) {
  const navigate = useNavigate();

  return (
    <Card 
      className="vf-card-clickable"
      onClick={() => navigate(createPageUrl('BuildingDetail') + `?id=${building.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[var(--vf-gradient-primary)] flex items-center justify-center text-white flex-shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 truncate">{building.name}</h3>
            {building.address && (
              <div className="flex items-center gap-1 text-sm text-[var(--theme-text-muted)] mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{building.address}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm">
                <Home className="h-4 w-4 text-[var(--theme-text-muted)]" />
                <span>{unitCount} Einheiten</span>
              </div>
              
              <div className="text-sm">
                <span className="font-semibold">{occupancyRate}%</span>
                <span className="text-[var(--theme-text-muted)]"> belegt</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}