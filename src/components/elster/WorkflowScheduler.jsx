import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Zap, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WorkflowScheduler() {
  const [workflowType, setWorkflowType] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [scheduled, setScheduled] = useState(false);

  const scheduleWorkflow = async () => {
    if (!workflowType) {
      toast.error('Bitte Workflow-Typ wählen');
      return;
    }

    try {
      const response = await base44.functions.invoke('scheduleAutomatedWorkflow', {
        workflow_type: workflowType,
        schedule,
        config: {}
      });

      if (response.data.success) {
        setScheduled(true);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error('Scheduling fehlgeschlagen');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Workflow Automation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scheduled ? (
          <>
            <div>
              <Label>Workflow</Label>
              <Select value={workflowType} onValueChange={setWorkflowType}>
                <SelectTrigger>
                  <SelectValue placeholder="Workflow wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_validate">Auto-Validierung</SelectItem>
                  <SelectItem value="deadline_reminders">Fristen-Erinnerungen</SelectItem>
                  <SelectItem value="monthly_report">Monats-Report</SelectItem>
                  <SelectItem value="auto_backup">Auto-Backup</SelectItem>
                  <SelectItem value="data_cleanup">Daten-Bereinigung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Zeitplan</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Stündlich</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={scheduleWorkflow} className="w-full">
              Workflow planen
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <div className="text-sm text-slate-600">Workflow geplant</div>
            <Button variant="outline" size="sm" onClick={() => setScheduled(false)} className="mt-3">
              Weiteren planen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}