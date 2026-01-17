import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BuildingsWidget() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Objekte
          <span className="vf-badge vf-badge-primary">{buildings.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {buildings.map((building) => (
            <Link key={building.id} to={createPageUrl('BuildingDetail') + `?id=${building.id}`}>
              <div className="p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors">
                <div className="font-medium text-sm">{building.name}</div>
                {building.address && (
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">{building.address}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link to={createPageUrl('Buildings')} className="w-full">
          <Button variant="outline" className="w-full">
            Alle ansehen
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}