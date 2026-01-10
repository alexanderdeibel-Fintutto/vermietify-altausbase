import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ACTION_CONFIGS = {
  slack: {
    send_message: {
      label: 'Nachricht senden',
      params: [
        { name: 'channel', label: 'Kanal', type: 'text', required: true },
        { name: 'message', label: 'Nachricht', type: 'textarea', required: true }
      ]
    },
    send_file: {
      label: 'Datei hochladen',
      params: [
        { name: 'channels', label: 'Kanäle', type: 'text', required: true },
        { name: 'title', label: 'Titel', type: 'text' }
      ]
    }
  },
  google_drive: {
    create_folder: {
      label: 'Ordner erstellen',
      params: [
        { name: 'folder_name', label: 'Ordnername', type: 'text', required: true },
        { name: 'parent_id', label: 'Parent Folder ID', type: 'text' }
      ]
    },
    upload_file: {
      label: 'Datei hochladen',
      params: [
        { name: 'file_name', label: 'Dateiname', type: 'text', required: true },
        { name: 'folder_id', label: 'Zielordner ID', type: 'text' }
      ]
    }
  },
  salesforce: {
    create_record: {
      label: 'Datensatz erstellen',
      params: [
        { name: 'sobject_type', label: 'SObject Typ', type: 'text', required: true },
        { name: 'record_data', label: 'Daten (JSON)', type: 'textarea', required: true }
      ]
    },
    update_record: {
      label: 'Datensatz aktualisieren',
      params: [
        { name: 'sobject_type', label: 'SObject Typ', type: 'text', required: true },
        { name: 'record_id', label: 'Record ID', type: 'text', required: true },
        { name: 'record_data', label: 'Daten (JSON)', type: 'textarea', required: true }
      ]
    }
  }
};

export default function WorkflowIntegrationAction({ companyId, onActionChange }) {
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [actionParams, setActionParams] = useState({});

  const { data: integrations = [] } = useQuery({
    queryKey: ['workflow-integrations', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowIntegration.filter({
        company_id: companyId,
        is_active: true
      });
      return result;
    }
  });

  const selectedIntegrationData = integrations.find(i => i.id === selectedIntegration);
  const serviceActions = selectedIntegrationData ? ACTION_CONFIGS[selectedIntegrationData.service_name] : {};
  const actionConfig = selectedAction ? serviceActions[selectedAction] : null;

  const handleParamChange = (paramName, value) => {
    const newParams = { ...actionParams, [paramName]: value };
    setActionParams(newParams);
    onActionChange?.({
      integration_id: selectedIntegration,
      action_type: selectedAction,
      params: newParams
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <label className="text-sm font-medium">Integration auswählen</label>
        <Select value={selectedIntegration} onValueChange={(v) => {
          setSelectedIntegration(v);
          setSelectedAction('');
          setActionParams({});
        }}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Integration..." />
          </SelectTrigger>
          <SelectContent>
            {integrations.map(int => (
              <SelectItem key={int.id} value={int.id}>
                {int.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIntegrationData && (
        <div>
          <label className="text-sm font-medium">Aktion auswählen</label>
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Aktion..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(serviceActions).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {actionConfig && (
        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs font-medium text-slate-600">Parameter</p>
          {actionConfig.params.map(param => (
            <div key={param.name}>
              <label className="text-sm font-medium">
                {param.label}
                {param.required && <span className="text-red-500">*</span>}
              </label>
              {param.type === 'text' && (
                <Input
                  value={actionParams[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  className="mt-1"
                  placeholder={param.label}
                />
              )}
              {param.type === 'textarea' && (
                <Textarea
                  value={actionParams[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  className="mt-1 h-20 font-mono text-xs"
                  placeholder={param.label}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}