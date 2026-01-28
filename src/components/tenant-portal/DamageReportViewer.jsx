import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, User, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function DamageReportViewer({ buildingId }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  
  // Schadenmeldungen laden
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['maintenance-tasks', buildingId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('v_maintenance_tasks')
        .select('*')
        .eq('kategorie', 'Reparatur');
      
      if (buildingId && buildingId !== 'all') {
        query = query.eq('building_id', buildingId);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  
  // Status ändern
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      const { data, error } = await supabase
        .from('MaintenanceTask')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      toast.success('Status aktualisiert');
    }
  });
  
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Dringend': return 'bg-red-100 text-red-800';
      case 'Hoch': return 'bg-orange-100 text-orange-800';
      case 'Mittel': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Erledigt': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Bearbeitung': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schadenmeldungen</h2>
          <p className="text-sm text-gray-600">Übersicht aller gemeldeten Schäden</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="Offen">Offen</SelectItem>
            <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
            <SelectItem value="Erledigt">Erledigt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12">Laden...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Keine Schadenmeldungen gefunden</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(report.status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{report.titel}</h3>
                        <p className="text-sm text-gray-600">{report.beschreibung}</p>
                      </div>
                      <Badge className={getUrgencyColor(report.prioritaet)}>
                        {report.prioritaet}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{report.unit_id || 'Keine Einheit'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.created_date).toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{report.zugewiesen_an || 'Nicht zugewiesen'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.status}</Badge>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      {report.status === 'Offen' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({
                            taskId: report.id,
                            newStatus: 'In Bearbeitung'
                          })}
                        >
                          In Bearbeitung nehmen
                        </Button>
                      )}
                      {report.status === 'In Bearbeitung' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({
                            taskId: report.id,
                            newStatus: 'Erledigt'
                          })}
                        >
                          Als erledigt markieren
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Zur Conversation wechseln
                          const conv = conversations.find(c => c.task_id === report.id);
                          if (conv) setSelectedConversation(conv);
                        }}
                      >
                        Chat öffnen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}