import React from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, MapPin, Layers, Users, TrendingUp } from 'lucide-react';

export default function BuildingDetailPage() {
  const { id } = useParams();

  const { data: building } = useQuery({
    queryKey: ['building', id],
    queryFn: () => base44.entities.Building?.read?.(id) || {}
  });

  const { data: units = [] } = useQuery({
    queryKey: ['building-units', id],
    queryFn: () => building?.id ? base44.entities.Unit?.filter?.({ building_id: id }) || [] : []
  });

  if (!building?.id) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Gebäude wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{building.address || 'Gebäude'}</h1>
          <p className="text-slate-600 mt-1 flex items-center gap-2"><MapPin className="w-4 h-4" />{building.city || '—'}, {building.postal_code || '—'}</p>
        </div>
        <Button><Edit className="w-4 h-4 mr-2" />Bearbeiten</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-sm text-emerald-900 flex items-center gap-2"><Layers className="w-4 h-4" /> Einheiten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">{units.length}</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-900 flex items-center gap-2"><Users className="w-4 h-4" /> Vermietet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{units.filter(u => u.status === 'occupied').length}</p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-900">Fläche</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{building.total_area || 0} m²</p>
          </CardContent>
        </Card>

        <Card className="border border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm text-green-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Wert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">€{((building.value || 0) / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informationen</TabsTrigger>
          <TabsTrigger value="units">Einheiten</TabsTrigger>
          <TabsTrigger value="financials">Finanzen</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Gebäudeinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600">Adresse</p>
                  <p className="font-semibold text-slate-900">{building.address || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Baujahr</p>
                  <p className="font-semibold text-slate-900">{building.year_built || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Grundstücksgröße</p>
                  <p className="font-semibold text-slate-900">{building.plot_area || '—'} m²</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Wohnfläche</p>
                  <p className="font-semibold text-slate-900">{building.living_area || '—'} m²</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Wohneinheiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {units.map((unit, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <p className="font-semibold text-slate-900">{unit.name || `Einheit ${idx + 1}`}</p>
                    <p className="text-sm text-slate-600">€{(unit.rent || 0).toFixed(2)}/Monat • {unit.status === 'occupied' ? '✓ Vermietet' : '⚠ Leer'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Finanzkennzahlen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600">Gesamtmieteinnahmen</p>
                  <p className="text-2xl font-bold text-slate-900">€{units.reduce((sum, u) => sum + (u.rent || 0), 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Belegungsquote</p>
                  <p className="text-2xl font-bold text-slate-900">{units.length > 0 ? Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}