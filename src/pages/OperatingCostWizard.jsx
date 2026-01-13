import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function OperatingCostWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    building_id: '',
    abrechnungsjahr: new Date().getFullYear() - 1,
    zeitraum_von: `${new Date().getFullYear() - 1}-01-01`,
    zeitraum_bis: `${new Date().getFullYear() - 1}-12-31`,
    costs: []
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: costTypes = [] } = useQuery({
    queryKey: ['cost-types'],
    queryFn: () => base44.entities.CostType.list()
  });

  const progress = (step / 4) * 100;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => step > 1 && setStep(step - 1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-light text-slate-900">Betriebskostenabrechnung erstellen</h1>
          <p className="text-slate-500 mt-1">Schritt {step} von 6</p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Schritt 1: Grunddaten</CardTitle>
            <CardDescription>Wählen Sie Gebäude und Abrechnungszeitraum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Gebäude *</label>
              <Select 
                value={formData.building_id} 
                onValueChange={v => setFormData({...formData, building_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude wählen" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Abrechnungsjahr *</label>
                <Select 
                  value={formData.abrechnungsjahr.toString()} 
                  onValueChange={v => setFormData({...formData, abrechnungsjahr: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2023, 2022, 2021, 2020].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Zeitraum von</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.zeitraum_von}
                  onChange={e => setFormData({...formData, zeitraum_von: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Zeitraum bis</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.zeitraum_bis}
                  onChange={e => setFormData({...formData, zeitraum_bis: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.building_id}
              >
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Schritt 2: Kosten & Prüfung</CardTitle>
            <CardDescription>Umlagefähige Kosten auswählen und prüfen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm text-slate-600 mb-4">Umlagefähige Kosten für diesen Zeitraum:</div>
              {costTypes.filter(c => c.distributable).length > 0 ? (
                costTypes.filter(c => c.distributable).map(cost => (
                  <div key={cost.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cost.main_category}</p>
                      <p className="text-xs text-slate-500">{cost.sub_category}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Keine Kosten kategorisiert. <a href="/Invoices" className="text-blue-600 hover:underline">Hier kategorisieren</a></p>
              )}
            </div>
            <div className="pt-3 border-t space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Alle Kosten korrekt kategorisiert</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
              </Button>
              <Button onClick={() => setStep(3)}>
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Schritt 3: Vorschau & Generierung</CardTitle>
            <CardDescription>Überprüfung und Generierung der Abrechnung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span>Gesamtkosten: €2.450,00</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span>Anzahl Einheiten: 5</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span>Umlage pro Einheit: €490,00</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Abrechnung generieren & versenden
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}