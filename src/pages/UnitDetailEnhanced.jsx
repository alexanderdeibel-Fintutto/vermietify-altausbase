import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, Link } from 'react-router-dom';
import { Home, FileText, Users, Euro, History, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function UnitDetailEnhanced() {
  const [searchParams] = useSearchParams();
  const unitId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: unit } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => base44.entities.Unit.get(unitId),
    enabled: !!unitId
  });

  const { data: building } = useQuery({
    queryKey: ['building', unit?.building_id],
    queryFn: () => base44.entities.Building.get(unit.building_id),
    enabled: !!unit?.building_id
  });

  if (!unit) return <div>Laden...</div>;

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <div className="vf-detail-header">
        <Link to={`/building-detail?id=${unit.building_id}`} className="vf-detail-header__back">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Objekt
        </Link>

        <div className="vf-detail-header__top">
          <div className="flex items-start gap-4 flex-1">
            <div className="vf-detail-header__icon">
              <Home className="h-7 w-7" />
            </div>
            <div className="vf-detail-header__info">
              <h1 className="vf-detail-header__title">{unit.einheit_nummer}</h1>
              <p className="vf-detail-header__subtitle">
                {building?.adresse} • {unit.flaeche} m² • {unit.zimmer} Zimmer
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="vf-detail-tabs">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="contract">Mietvertrag</TabsTrigger>
          <TabsTrigger value="tenant">Mieter</TabsTrigger>
          <TabsTrigger value="finances">Finanzen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
        </TabsList>

        <div className="vf-detail-main">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Einheit-Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="vf-data-grid">
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Typ</div>
                    <div className="vf-data-field__value">{unit.typ}</div>
                  </div>
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Stockwerk</div>
                    <div className="vf-data-field__value">{unit.stockwerk}</div>
                  </div>
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Fläche</div>
                    <div className="vf-data-field__value">{unit.flaeche} m²</div>
                  </div>
                  <div className="vf-data-field">
                    <div className="vf-data-field__label">Zimmer</div>
                    <div className="vf-data-field__value">{unit.zimmer}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}