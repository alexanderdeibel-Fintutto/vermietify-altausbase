import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Zap, Plus } from 'lucide-react';

const INTEGRATION_CONFIGS = {
  slack: {
    name: 'Slack',
    icon: '💬',
    actions: ['send_message', 'send_file', 'update_user_status'],
    triggers: [],
    fields: []
  },
  google_drive: {
    name: 'Google Drive',
    icon: '📁',
    actions: ['create_folder', 'upload_file', 'share_file'],
    triggers: [],
    fields: []
  },
  salesforce: {
    name: 'Salesforce',
    icon: '☁️',
    actions: ['create_record', 'update_record', 'query'],
    triggers: [],
    fields: [
      { name: 'instance_url', label: 'Instance URL', type: 'text', required: true }
    ]
  },
  webhook: {
    name: 'Webhook',
    icon: '🔗',
    actions: ['custom'],
    triggers: [],
    fields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'text', required: true },
      { name: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
      { name: 'custom_headers', label: 'Custom Headers (JSON)', type: 'textarea' }
    ]
  }
};

export default function IntegrationSetup({ companyId, onIntegrationAdded }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {}
  });
  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ['workflow-integrations', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowIntegration.filter({
        company_id: companyId
      });
      return result;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.asServiceRole.entities.WorkflowIntegration.create({
        company_id: companyId,
        service_name: selectedService,
        integration_type: 'action',
        name: formData.name,
        description: formData.description,
        config: formData.config,
        created_by: (await base44.auth.me()).email
      });
      return result;
    },
    onSuccess: (data) => {
      // Test connection
      testMutation.mutate(data.id);
      queryClient.invalidateQueries({ queryKey: ['workflow-integrations'] });
      setShowDialog(false);
      setSelectedService('');
      setFormData({ name: '', description: '', config: {} });
      onIntegrationAdded?.(data);
    }
  });

  const testMutation = useMutation({
    mutationFn: (integrationId) =>
      base44.functions.invoke('testWorkflowIntegration', {
        service_name: selectedService,
        config: formData.config
      })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.WorkflowIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-integrations'] });
    }
  });

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setFormData({
      name: INTEGRATION_CONFIGS[service].name,
      description: '',
      config: {}
    });
  };

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const config = INTEGRATION_CONFIGS[selectedService];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Externe Integrationen</h3>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Integration hinzufügen
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Externe Integration verbinden</DialogTitle>
          </DialogHeader>

          {!selectedService ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(INTEGRATION_CONFIGS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleServiceSelect(key)}
                  className="p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-2xl">{config.icon}</span>
                  <p className="font-medium mt-2">{config.name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {config.actions.length} Aktionen
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Beschreibung</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 h-16"
                />
              </div>

              {config.fields.map(field => (
                <div key={field.name}>
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <Input
                      value={formData.config[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="mt-1"
                      placeholder={field.label}
                    />
                  )}
                  {field.type === 'select' && (
                    <Select
                      value={formData.config[field.name] || field.default}
                      onValueChange={(v) => handleConfigChange(field.name, v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(opt => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === 'textarea' && (
                    <Textarea
                      value={formData.config[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="mt-1 h-20 font-mono text-xs"
                      placeholder="{}"
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedService('');
                    setFormData({ name: '', description: '', config: {} });
                  }}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.name || createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? 'Wird verbunden...' : 'Verbinden'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Integrations List */}
      <div className="space-y-2">
        {integrations.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Integrationen verbunden
            </CardContent>
          </Card>
        ) : (
          integrations.map(integration => (
            <Card key={integration.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {INTEGRATION_CONFIGS[integration.service_name]?.icon}
                      </span>
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-xs text-slate-600">
                          {INTEGRATION_CONFIGS[integration.service_name]?.name}
                        </p>
                      </div>
                      {integration.test_result?.success ? (
                        <Badge className="ml-auto bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verbunden
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="ml-auto">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Fehler
                        </Badge>
                      )}
                    </div>
                    {integration.description && (
                      <p className="text-sm text-slate-700 mb-2">{integration.description}</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(integration.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}