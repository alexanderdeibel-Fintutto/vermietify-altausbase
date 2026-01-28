import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import StatementStatusBadge from '@/components/shared/StatementStatusBadge';

export default function RecentStatementsWidget({ limit = 5 }) {
  const { data: statements = [] } = useQuery({
    queryKey: ['recentStatements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_operating_cost_summary')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_buildings_summary')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Letzte Abrechnungen</CardTitle>
          <Link to={createPageUrl('OperatingCosts')}>
            <Button variant="ghost" size="sm">
              Alle anzeigen
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {statements.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Noch keine Abrechnungen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {statements.map(statement => {
              const building = getBuilding(statement.building_id);
              return (
                <Link 
                  key={statement.id}
                  to={createPageUrl('OperatingCosts')}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Abrechnung {statement.abrechnungsjahr}</p>
                    <StatementStatusBadge status={statement.status} />
                  </div>
                  <p className="text-xs text-gray-600">{building?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(statement.created_date).toLocaleDateString('de-DE')}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}