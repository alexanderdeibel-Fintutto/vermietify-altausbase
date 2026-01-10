import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Copy, CheckCircle2, Archive, GitBranch } from 'lucide-react';
import CreateVersionDialog from './CreateVersionDialog';
import VersionTransitionDialog from './VersionTransitionDialog';

export default function WorkflowVersionManager({ workflowId, companyId }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['workflow-versions', workflowId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowVersion.filter({
        workflow_id: workflowId
      });
      return result.sort((a, b) => b.version_number - a.version_number);
    }
  });

  const { data: runningInstances = [] } = useQuery({
    queryKey: ['running-instances', workflowId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowExecution.filter({
        workflow_id: workflowId,
        status: 'running'
      });
      return result;
    }
  });

  const activateVersionMutation = useMutation({
    mutationFn: async (versionId) => {
      const versionToActivate = versions.find(v => v.id === versionId);
      const currentActive = versions.find(v => v.is_active);

      if (currentActive && currentActive.id !== versionId) {
        await base44.asServiceRole.entities.WorkflowVersion.update(currentActive.id, {
          is_active: false
        });
      }

      return base44.asServiceRole.entities.WorkflowVersion.update(versionId, {
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-versions'] });
    }
  });

  const archiveVersionMutation = useMutation({
    mutationFn: (versionId) =>
      base44.asServiceRole.entities.WorkflowVersion.update(versionId, {
        is_archived: true
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-versions'] });
    }
  });

  const activeVersion = versions.find(v => v.is_active);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Workflow-Versionen
        </h3>
        <div className="flex gap-2">
          {runningInstances.length > 0 && activeVersion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedVersion(activeVersion);
                setShowTransitionDialog(true);
              }}
            >
              Übergänge verwalten
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Neue Version
          </Button>
        </div>
      </div>

      {showCreateDialog && (
        <CreateVersionDialog
          workflowId={workflowId}
          companyId={companyId}
          currentVersion={activeVersion}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            queryClient.invalidateQueries({ queryKey: ['workflow-versions'] });
          }}
        />
      )}

      {showTransitionDialog && selectedVersion && (
        <VersionTransitionDialog
          workflowId={workflowId}
          companyId={companyId}
          fromVersion={selectedVersion}
          runningInstances={runningInstances}
          onClose={() => {
            setShowTransitionDialog(false);
            setSelectedVersion(null);
          }}
          onSuccess={() => {
            setShowTransitionDialog(false);
            setSelectedVersion(null);
            queryClient.invalidateQueries({ queryKey: ['running-instances'] });
          }}
        />
      )}

      {/* Versions List */}
      <div className="space-y-2">
        {versions.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Versionen vorhanden
            </CardContent>
          </Card>
        ) : (
          versions.map(version => {
            const instancesOnVersion = runningInstances.filter(
              e => e.workflow_version === version.version_number
            ).length;

            return (
              <Card
                key={version.id}
                className={version.is_active ? 'border-green-200 bg-green-50' : ''}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-slate-900">
                          Version {version.version_number}
                        </h4>
                        {version.is_active && (
                          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktiv
                          </Badge>
                        )}
                        {version.is_archived && (
                          <Badge variant="outline" className="text-slate-600">
                            Archiviert
                          </Badge>
                        )}
                      </div>

                      {version.description && (
                        <p className="text-sm text-slate-600 mb-2">{version.description}</p>
                      )}

                      {version.change_notes && (
                        <div className="text-xs text-slate-600 bg-white p-2 rounded mb-2">
                          <p className="font-medium">Änderungen:</p>
                          <p>{version.change_notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                        <span>
                          Erstellt: {format(new Date(version.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                        <span>•</span>
                        <span>Von: {version.created_by}</span>
                        <span>•</span>
                        <span>{version.steps?.length || 0} Schritte</span>
                        <span>•</span>
                        <span>{version.total_executions} Ausführungen</span>
                        {instancesOnVersion > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-orange-600">
                              {instancesOnVersion} laufend
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {!version.is_active && !version.is_archived && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateVersionMutation.mutate(version.id)}
                          disabled={activateVersionMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!version.is_archived && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => archiveVersionMutation.mutate(version.id)}
                          disabled={archiveVersionMutation.isPending}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}