import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AutomatedCommunication() {
  const { data: automations = [], refetch } = useQuery({
    queryKey: ['automations'],
    queryFn: () => base44.entities.WorkflowAutomation?.list?.('-updated_date', 50) || Promise.resolve([]),
    staleTime: 0,
  });

  const handleToggle = async (id, currentEnabled) => {
    try {
      await base44.functions.invoke('sendAutomatedCommunication', {
        action: 'toggleAutomation',
        automationId: id,
        enabled: !currentEnabled,
      });
      refetch();
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Automatisierte Kommunikation</h1>
          <p className="text-slate-600 font-light mt-2">Konfigurieren Sie automatische Nachrichtenabläufe</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Automation
        </Button>
      </div>

      <div className="space-y-3">
         {automations.length === 0 ? (
           <Card>
             <CardContent className="pt-6 text-center text-slate-500">
               Keine Automatisierungen eingerichtet
             </CardContent>
           </Card>
         ) : (
           automations.map(automation => (
             <Card key={automation.id}>
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-medium text-slate-900">{automation.title || automation.name}</h3>
                       {automation.enabled ? (
                         <CheckCircle2 className="w-4 h-4 text-green-600" />
                       ) : (
                         <AlertCircle className="w-4 h-4 text-slate-400" />
                       )}
                     </div>
                     <p className="text-sm text-slate-600 mt-1">
                       Trigger: {automation.trigger_event || 'Manual'} → Kanal: {automation.channel || 'Email'}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => handleToggle(automation.id, automation.enabled)}>
                       {automation.enabled ? (
                         <ToggleRight className="w-6 h-6 text-green-600" />
                       ) : (
                         <ToggleLeft className="w-6 h-6 text-slate-400" />
                       )}
                     </button>
                     <Button size="sm" variant="ghost">
                       <Edit2 className="w-4 h-4" />
                     </Button>
                     <Button size="sm" variant="ghost" className="text-red-600">
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))
         )}
       </div>

      {/* Vorlagen */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Zahlungserinnerung', 'Wartungsankündigung', 'Willkommen', 'Vertragsverlängerung'].map(template => (
            <button key={template} className="p-3 border rounded-lg hover:bg-slate-50 text-left">
              <p className="text-sm font-medium">{template}</p>
              <p className="text-xs text-slate-500 mt-1">Template verwenden</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}