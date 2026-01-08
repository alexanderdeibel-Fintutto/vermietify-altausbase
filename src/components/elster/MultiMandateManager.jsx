import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, Users, Building2, Plus, 
  Eye, FileText, TrendingUp, Search 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function MultiMandateManager({ onSwitchMandate }) {
  const [searchTerm, setSearchTerm] = useState('');

  // In Realität würde man Mandanten-Daten laden
  const mandates = [
    {
      id: '1',
      name: 'Max Mustermann',
      buildings: 5,
      submissions: 12,
      status: 'active',
      last_activity: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      name: 'Immobilien GmbH & Co. KG',
      buildings: 15,
      submissions: 45,
      status: 'active',
      last_activity: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '3',
      name: 'Schmidt Verwaltungs GbR',
      buildings: 8,
      submissions: 24,
      status: 'active',
      last_activity: new Date(Date.now() - 604800000).toISOString()
    }
  ];

  const filteredMandates = mandates.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBuildings = mandates.reduce((sum, m) => sum + m.buildings, 0);
  const totalSubmissions = mandates.reduce((sum, m) => sum + m.submissions, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Mandanten-Verwaltung
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Mandant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600">Mandanten</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {mandates.length}
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">Objekte</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {totalBuildings}
            </div>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-600">Einreichungen</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {totalSubmissions}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Mandant suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Mandates List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMandates.map(mandate => (
            <div
              key={mandate.id}
              className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onSwitchMandate?.(mandate)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium mb-1">{mandate.name}</div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span>{mandate.buildings} Objekte</span>
                    <span>·</span>
                    <span>{mandate.submissions} Einreichungen</span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Aktiv
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Letzte Aktivität: {new Date(mandate.last_activity).toLocaleDateString('de-DE')}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwitchMandate?.(mandate);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Anzeigen
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredMandates.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Keine Mandanten gefunden</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}