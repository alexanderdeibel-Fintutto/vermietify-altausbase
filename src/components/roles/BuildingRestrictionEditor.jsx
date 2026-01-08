import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BuildingRestrictionEditor({ assignmentId, currentRestrictions = [] }) {
  const [selectedBuildings, setSelectedBuildings] = useState(currentRestrictions);
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.asServiceRole.entities.UserRoleAssignment.update(assignmentId, {
        building_restrictions: selectedBuildings.length > 0 ? selectedBuildings : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] });
      toast.success('Gebäude-Einschränkungen aktualisiert');
    }
  });

  const toggleBuilding = (buildingId) => {
    setSelectedBuildings(prev =>
      prev.includes(buildingId) ? prev.filter(id => id !== buildingId) : [...prev, buildingId]
    );
  };

  const toggleAll = () => {
    setSelectedBuildings(prev => prev.length === buildings.length ? [] : buildings.map(b => b.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Gebäude-Einschränkungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm">
            {selectedBuildings.length === 0 ? (
              <span className="font-medium">✓ Zugriff auf alle Gebäude</span>
            ) : (
              <span className="font-medium">
                Eingeschränkt auf {selectedBuildings.length} Gebäude
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selectedBuildings.length === buildings.length ? 'Alle abwählen' : 'Alle wählen'}
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {buildings.map(building => (
            <div key={building.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
              <Checkbox
                checked={selectedBuildings.includes(building.id)}
                onCheckedChange={() => toggleBuilding(building.id)}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{building.name}</div>
                <div className="text-xs text-slate-500">{building.address}</div>
              </div>
              {selectedBuildings.includes(building.id) && (
                <Badge variant="secondary">Eingeschränkt</Badge>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichere...</>
          ) : (
            'Einschränkungen speichern'
          )}
        </Button>

        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
          <strong>Hinweis:</strong> Wenn keine Gebäude ausgewählt sind, hat der Benutzer 
          Zugriff auf alle Gebäude gemäß seiner Rolle.
        </div>
      </CardContent>
    </Card>
  );
}