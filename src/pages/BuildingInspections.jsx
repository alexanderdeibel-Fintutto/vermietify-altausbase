import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Calendar, Wand2, FileText, Sparkles } from 'lucide-react';
import InspectionScheduler from '@/components/inspection/InspectionScheduler';
import InspectionChecklistForm from '@/components/inspection/InspectionChecklistForm';
import InspectionAIPredictions from '@/components/inspection/InspectionAIPredictions';

export default function BuildingInspections() {
  const [selectedInspection, setSelectedInspection] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Building.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.BuildingInspection.list('-inspection_date', 50)
  });

  const generateTasksMutation = useMutation({
    mutationFn: (inspectionId) =>
      base44.functions.invoke('generateTasksFromInspection', { inspection_id: inspectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      alert('Wartungsaufgaben erfolgreich generiert!');
    }
  });

  const completeInspectionMutation = useMutation({
    mutationFn: (inspectionId) =>
      base44.entities.BuildingInspection.update(inspectionId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setSelectedInspection(null);
    }
  });

  const companyId = buildings[0]?.company_id;

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    reviewed: 'bg-purple-100 text-purple-800'
  };

  const statusLabels = {
    scheduled: 'Geplant',
    in_progress: 'Läuft',
    completed: 'Abgeschlossen',
    reviewed: 'Geprüft'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8" />
          Gebäudeinspektionen
        </h1>
        <p className="text-slate-600 mt-1">
          Inspektionen durchführen und verwalten
        </p>
      </div>

      {!selectedInspection ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InspectionScheduler companyId={companyId} />
          </div>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Alle Inspektionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inspections.map(insp => {
                const building = buildings.find(b => b.id === insp.building_id);
                return (
                  <div key={insp.id} className="p-3 border rounded hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedInspection(insp)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{building?.name || building?.address?.street}</h4>
                        <p className="text-xs text-slate-600">{insp.inspection_type}</p>
                      </div>
                      <Badge className={statusColors[insp.status]}>
                        {statusLabels[insp.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>📅 {new Date(insp.inspection_date).toLocaleDateString('de-DE')}</span>
                      {insp.findings_count > 0 && (
                        <span>📋 {insp.findings_count} Befunde</span>
                      )}
                      {insp.tasks_generated > 0 && (
                        <span>✓ {insp.tasks_generated} Aufgaben</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="checklist">
              <TabsList>
                <TabsTrigger value="checklist">Checkliste</TabsTrigger>
                <TabsTrigger value="predictions">KI-Vorhersage</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist" className="mt-4">
                <InspectionChecklistForm
                  inspectionId={selectedInspection.id}
                  buildingId={selectedInspection.building_id}
                  companyId={companyId}
                />
              </TabsContent>

              <TabsContent value="predictions" className="mt-4">
                <InspectionAIPredictions buildingId={selectedInspection.building_id} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => generateTasksMutation.mutate(selectedInspection.id)}
                  disabled={generateTasksMutation.isPending}
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Aufgaben generieren
                </Button>
                <Button
                  variant="outline"
                  onClick={() => completeInspectionMutation.mutate(selectedInspection.id)}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Abschließen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInspection(null)}
                  className="w-full"
                >
                  Zurück zur Übersicht
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}