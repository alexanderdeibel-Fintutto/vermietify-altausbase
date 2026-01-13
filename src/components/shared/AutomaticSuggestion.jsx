import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutomaticSuggestion({ buildingId, type = 'operating_costs' }) {
  const [suggestions, setSuggestions] = useState([]);

  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => base44.entities.Building.filter({ id: buildingId }).then(r => r[0]),
    enabled: !!buildingId
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', buildingId],
    queryFn: async () => {
      const units = await base44.entities.Unit.filter({ building_id: buildingId });
      const unitIds = units.map(u => u.id);
      return base44.entities.LeaseContract.filter({ unit_id: { $in: unitIds } });
    },
    enabled: !!buildingId
  });

  useEffect(() => {
    if (!building || !contracts.length) return;

    const newSuggestions = [];

    // Operating costs suggestion
    if (type === 'operating_costs') {
      const today = new Date();
      const lastSuggestionDate = building.last_operating_costs_date 
        ? new Date(building.last_operating_costs_date)
        : new Date(building.created_date);
      
      const daysSinceLast = Math.floor((today - lastSuggestionDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLast > 365) {
        newSuggestions.push({
          id: 'operating_costs',
          title: 'Betriebskostenabrechnung fällig',
          description: `Letzte Abrechnung vor ${daysSinceLast} Tagen. Zeit für Jahresabrechnung!`,
          action: 'Jetzt abrechnen',
          actionUrl: '/operating-costs'
        });
      }
    }

    // Contract renewal suggestion
    const expiringContracts = contracts.filter(c => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      const daysUntilEnd = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd < 120;
    });

    if (expiringContracts.length > 0) {
      newSuggestions.push({
        id: 'contract_renewal',
        title: 'Mietverträge laufen aus',
        description: `${expiringContracts.length} Vertrag(e) läuft/laufen in den nächsten 4 Monaten ab`,
        action: 'Verträge anschauen',
        actionUrl: '/contracts'
      });
    }

    setSuggestions(newSuggestions);
  }, [building, contracts, type]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {suggestions.map(suggestion => (
        <Card key={suggestion.id} className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 text-sm">{suggestion.title}</p>
                <p className="text-xs text-blue-700 mt-1">{suggestion.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-blue-700 border-blue-300 hover:bg-blue-100"
                  onClick={() => toast.info('Navigation zu ' + suggestion.actionUrl)}
                >
                  {suggestion.action}
                </Button>
              </div>
              <button
                onClick={() => setSuggestions(suggestions.filter(s => s.id !== suggestion.id))}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}