import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

export default function VersionTransitionDialog({
  workflowId,
  companyId,
  fromVersion,
  runningInstances,
  onClose,
  onSuccess
}) {
  const [strategy, setStrategy] = useState('complete_on_current');
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const transitionMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageWorkflowVersionTransition', {
        action: 'migrate_instances',
        workflow_id: workflowId,
        company_id: companyId,
        from_version: fromVersion.version_number,
        to_version: fromVersion.version_number + 1,
        execution_ids: selectAll ? [] : selectedInstances,
        transition_strategy: strategy
      }),
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInstances(runningInstances.map(i => i.id));
    } else {
      setSelectedInstances([]);
    }
  };

  const toggleInstance = (instanceId) => {
    setSelectedInstances(prev =>
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow-Versionsübergang verwalten</DialogTitle>
          <DialogDescription>
            Verwalten Sie, wie {runningInstances.length} laufende Instanzen mit der neuen Version umgehen sollen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Strategy Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Übergangsstrategie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroup value={strategy} onValueChange={setStrategy}>
                    <RadioGroupItem value="complete_on_current" id="complete" />
                  </RadioGroup>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Auf aktueller Version abschließen</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Laufende Instanzen werden auf ihrer aktuellen Version (v{fromVersion.version_number}) abgeschlossen. Neue Instanzen verwenden die neue Version.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroup value={strategy} onValueChange={setStrategy}>
                    <RadioGroupItem value="migrate_to_new" id="migrate" />
                  </RadioGroup>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Zur neuen Version migrieren</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Laufende Instanzen werden zur neuen Version migriert. Dies könnte Auswirkungen haben, wenn sich Schritte wesentlich unterscheiden.
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Instance Selection */}
          {strategy === 'migrate_to_new' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Betroffene Instanzen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Alle auswählen ({runningInstances.length})</span>
                </label>

                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {runningInstances.map(instance => (
                    <label key={instance.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <Checkbox
                        checked={selectedInstances.includes(instance.id)}
                        onCheckedChange={() => toggleInstance(instance.id)}
                      />
                      <span className="text-sm text-slate-700">
                        {instance.workflow_id} ({instance.steps_completed?.length || 0} Schritte)
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-900">
                {strategy === 'complete_on_current'
                  ? `${runningInstances.length} Instanzen werden auf Version ${fromVersion.version_number} abgeschlossen.`
                  : `${selectedInstances.length > 0 ? selectedInstances.length : runningInstances.length} Instanzen werden zur neuen Version migriert.`
                }
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={() => transitionMutation.mutate()}
              disabled={
                (strategy === 'migrate_to_new' && selectedInstances.length === 0) ||
                transitionMutation.isPending
              }
              className="flex-1"
            >
              {transitionMutation.isPending ? 'Verarbeitet...' : 'Übergang anwenden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}