import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, AlertTriangle, CheckCircle, Calendar, Plus } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EnergyPassportPanel({ buildingId }) {
  const { data: passports = [] } = useQuery({
    queryKey: ['energyPassports', buildingId],
    queryFn: () => base44.entities.EnergyPassport.filter({ building_id: buildingId })
  });

  const activePassport = passports.find(p => p.status === 'Gültig') || passports[0];

  const getEfficiencyColor = (klasse) => {
    if (['A+', 'A', 'B'].includes(klasse)) return 'bg-emerald-500';
    if (['C', 'D'].includes(klasse)) return 'bg-yellow-500';
    if (['E', 'F'].includes(klasse)) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Gültig': return 'bg-emerald-100 text-emerald-700';
      case 'Läuft bald ab': return 'bg-amber-100 text-amber-700';
      case 'Abgelaufen': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!activePassport) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">Kein Energieausweis vorhanden</p>
              <p className="text-sm text-amber-700 mt-1">
                Bei Neuvermietung muss ein gültiger Energieausweis vorliegen (GEG-Pflicht)
              </p>
            </div>
            <Link to={createPageUrl('EnergyPassportManager')}>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-1" />
                Erstellen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthsRemaining = differenceInMonths(new Date(activePassport.gueltig_bis), new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Energieausweis</CardTitle>
          <Badge className={getStatusColor(activePassport.status)}>
            {activePassport.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${getEfficiencyColor(activePassport.energieeffizienzklasse)} flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">{activePassport.energieeffizienzklasse}</span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{activePassport.ausweis_typ}</p>
            <p className="text-sm text-slate-600">
              {activePassport.endenergiebedarf} kWh/(m²·a)
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Energieträger:</span>
            <span className="font-medium">{activePassport.energietraeger}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Gültig bis:</span>
            <span className="font-medium">
              {format(new Date(activePassport.gueltig_bis), 'dd.MM.yyyy', { locale: de })}
            </span>
          </div>
        </div>

        {monthsRemaining <= 12 && monthsRemaining > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              Ausweis läuft in {monthsRemaining} Monat(en) ab
            </AlertDescription>
          </Alert>
        )}

        {activePassport.pflichtangaben_generiert && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-1">Pflichtangaben für Anzeigen:</p>
            <p className="text-xs text-blue-700">{activePassport.pflichtangaben_generiert}</p>
          </div>
        )}

        <div className="flex gap-2">
          {activePassport.datei_url && (
            <Button size="sm" variant="outline" onClick={() => window.open(activePassport.datei_url, '_blank')} className="flex-1">
              <FileText className="w-4 h-4 mr-1" />
              PDF anzeigen
            </Button>
          )}
          <Link to={createPageUrl('EnergyPassportManager')} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              Verwalten
            </Button>
          </Link>
        </div>
      </CardContent>

      <EnergyPassportUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        buildingId={buildingId}
      />
    </Card>
  );
}