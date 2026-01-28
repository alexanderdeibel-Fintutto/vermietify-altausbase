import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/components/services/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Calendar, CheckCircle, Clock, Send, Search, Filter } from 'lucide-react';

export default function OperatingCosts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStatement, setSelectedStatement] = useState(null);

  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['operatingCostStatements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_operating_cost_summary')
        .select('*')
        .order('abrechnungsjahr', { ascending: false });
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

  const filteredStatements = statements.filter(s => {
    const matchesSearch = !searchTerm || 
      s.abrechnungsjahr?.toString().includes(searchTerm) ||
      buildings.find(b => b.id === s.building_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const drafts = filteredStatements.filter(s => s.status === 'Entwurf');
  const completed = filteredStatements.filter(s => s.status !== 'Entwurf');

  const getBuilding = (buildingId) => buildings.find(b => b.id === buildingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Abrechnungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nebenkostenabrechnungen</h1>
          <p className="text-gray-600 mt-1">{statements.length} Abrechnungen insgesamt</p>
        </div>
        <Link to={createPageUrl('OperatingCostWizard')}>
          <Button size="lg" className="bg-gradient-to-r from-blue-900 to-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Neue Abrechnung
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Jahr oder Objekt suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="Entwurf">Entwürfe</SelectItem>
                <SelectItem value="Berechnet">Berechnet</SelectItem>
                <SelectItem value="Versendet">Versendet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {statements.length === 0 ? (
        <Card className="p-16 text-center">
          <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Noch keine Abrechnungen</h2>
          <p className="text-gray-600 mb-6">Erstellen Sie Ihre erste Nebenkostenabrechnung</p>
          <Link to={createPageUrl('OperatingCostWizard')}>
            <Button size="lg" className="bg-blue-900">
              <Plus className="w-5 h-5 mr-2" />
              Erste Abrechnung erstellen
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Drafts */}
          {drafts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Entwürfe ({drafts.length})
              </h2>
              {drafts.map(statement => {
                const building = getBuilding(statement.building_id);
                return (
                  <Link 
                    key={statement.id}
                    to={createPageUrl('OperatingCostWizard') + `?id=${statement.id}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-300 bg-yellow-50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FileText className="w-10 h-10 text-yellow-600" />
                            <div>
                              <h3 className="font-semibold text-lg">
                                Abrechnung {statement.abrechnungsjahr}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {building?.name || 'Unbekanntes Objekt'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Zuletzt bearbeitet: {new Date(statement.updated_date).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline">Fortsetzen</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Completed */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Abgeschlossene Abrechnungen ({completed.length})
            </h2>
            
            {completed.map(statement => {
              const building = getBuilding(statement.building_id);
              
              return (
                <Card 
                  key={statement.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedStatement(selectedStatement?.id === statement.id ? null : statement)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FileText className="w-10 h-10 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">Abrechnung {statement.abrechnungsjahr}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {building?.name} • {building?.address}, {building?.city}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - 
                            {new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          statement.status === 'Versendet' ? 'bg-green-100 text-green-700' :
                          statement.status === 'Berechnet' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {statement.status === 'Versendet' && <Send className="w-3 h-3 mr-1" />}
                          {statement.status}
                        </Badge>
                        {statement.gesamtkosten && (
                          <div className="mt-2 font-semibold text-lg">
                            {statement.gesamtkosten.toFixed(2)} €
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedStatement?.id === statement.id && (
                      <div className="mt-6 pt-6 border-t grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Gesamtkosten</p>
                          <p className="text-lg font-semibold">{statement.gesamtkosten?.toFixed(2) || '0.00'} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Vorauszahlungen</p>
                          <p className="text-lg font-semibold">{statement.gesamtvorauszahlungen?.toFixed(2) || '0.00'} €</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ergebnis</p>
                          <p className={`text-lg font-semibold ${
                            statement.gesamtergebnis >= 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {statement.gesamtergebnis >= 0 ? '+' : ''}{statement.gesamtergebnis?.toFixed(2) || '0.00'} €
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}