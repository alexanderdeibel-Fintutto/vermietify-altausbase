import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AnlageVDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: anlagenV = [], isLoading } = useQuery({
    queryKey: ['anlagenV', selectedYear],
    queryFn: () => base44.entities.AnlageV.filter({ tax_year: selectedYear })
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const getBuilding = (id) => buildings.find(b => b.id === id);

  const statusColor = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    CALCULATED: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-green-100 text-green-800'
  };

  const totalRentals = anlagenV.reduce((sum, a) => sum + (a.total_rentals || 0), 0);
  const totalExpenses = anlagenV.reduce((sum, a) => sum + (a.total_expenses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Anlage V Übersicht</h1>
        <Link to={createPageUrl('AnlageVForm')}>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Neue Anlage V
          </Button>
        </Link>
      </div>

      {/* Year Filter */}
      <div className="flex gap-2">
        {[2024, 2025, 2026].map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded ${
              selectedYear === year
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">Gesamt Einnahmen</p>
            <p className="text-2xl font-bold text-green-700">
              €{totalRentals.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">Gesamt Ausgaben</p>
            <p className="text-2xl font-bold text-red-700">
              €{totalExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-2">Gesamt Gewinn</p>
            <p className={`text-2xl font-bold ${totalRentals - totalExpenses >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              €{(totalRentals - totalExpenses).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8">Lädt...</div>
      ) : anlagenV.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8 text-gray-500">
            Keine Anlage V für {selectedYear} erstellt
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {anlagenV.map(anlage => {
            const building = getBuilding(anlage.building_id);
            return (
              <Card key={anlage.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{building?.name || 'Gebäude'}</h3>
                      <p className="text-sm text-gray-600">Steuerjahr: {anlage.tax_year}</p>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Einnahmen</p>
                          <p className="font-semibold">€{(anlage.total_rentals || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ausgaben</p>
                          <p className="font-semibold">€{(anlage.total_expenses || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Gewinn/Verlust</p>
                          <p className={`font-semibold ${(anlage.net_income || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            €{(anlage.net_income || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[anlage.status]}`}>
                        {anlage.status}
                      </span>
                      <Link to={`${createPageUrl('AnlageVForm')}?id=${anlage.id}`}>
                        <Button variant="outline" size="icon">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" title="PDF herunterladen">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}