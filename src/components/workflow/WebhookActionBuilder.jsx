import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Plus, X } from 'lucide-react';

export default function WebhookActionBuilder({ action, onChange }) {
  const addHeader = () => {
    const headers = action.config?.headers || [];
    onChange({
      ...action,
      config: {
        ...action.config,
        headers: [...headers, { key: '', value: '' }]
      }
    });
  };

  const updateHeader = (index, field, value) => {
    const headers = [...(action.config?.headers || [])];
    headers[index][field] = value;
    onChange({
      ...action,
      config: { ...action.config, headers }
    });
  };

  const removeHeader = (index) => {
    const headers = (action.config?.headers || []).filter((_, i) => i !== index);
    onChange({
      ...action,
      config: { ...action.config, headers }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4" />
          Webhook Konfiguration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">HTTP Methode</label>
          <Select
            value={action.config?.method || 'POST'}
            onValueChange={(method) => onChange({
              ...action,
              config: { ...action.config, method }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Webhook URL</label>
          <Input
            placeholder="https://api.example.com/webhook"
            value={action.config?.url || ''}
            onChange={(e) => onChange({
              ...action,
              config: { ...action.config, url: e.target.value }
            })}
          />
          <p className="text-xs text-slate-600 mt-1">
            Die URL des externen Systems, das benachrichtigt werden soll
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold">Headers (optional)</label>
            <Button onClick={addHeader} size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              Header
            </Button>
          </div>
          {action.config?.headers?.length > 0 && (
            <div className="space-y-2">
              {action.config.headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeHeader(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Body Template (JSON)</label>
          <Textarea
            placeholder={`{
  "event": "workflow_triggered",
  "entity": "{{entity}}",
  "data": "{{data}}"
}`}
            value={action.config?.body || ''}
            onChange={(e) => onChange({
              ...action,
              config: { ...action.config, body: e.target.value }
            })}
            rows={8}
            className="font-mono text-xs"
          />
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold">Verfügbare Variablen:</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">{'{{entity}}'}</Badge>
              <Badge variant="outline" className="text-xs">{'{{entity_id}}'}</Badge>
              <Badge variant="outline" className="text-xs">{'{{timestamp}}'}</Badge>
              <Badge variant="outline" className="text-xs">{'{{user_email}}'}</Badge>
              <Badge variant="outline" className="text-xs">{'{{data}}'}</Badge>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Authentifizierung</label>
          <Select
            value={action.config?.auth_type || 'none'}
            onValueChange={(auth_type) => onChange({
              ...action,
              config: { ...action.config, auth_type }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
              <SelectItem value="api_key">API Key</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {action.config?.auth_type === 'bearer' && (
          <div>
            <label className="text-sm font-semibold mb-2 block">Bearer Token</label>
            <Input
              type="password"
              placeholder="Token eingeben"
              value={action.config?.auth_token || ''}
              onChange={(e) => onChange({
                ...action,
                config: { ...action.config, auth_token: e.target.value }
              })}
            />
          </div>
        )}

        {action.config?.auth_type === 'basic' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold mb-2 block">Username</label>
              <Input
                value={action.config?.auth_username || ''}
                onChange={(e) => onChange({
                  ...action,
                  config: { ...action.config, auth_username: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Password</label>
              <Input
                type="password"
                value={action.config?.auth_password || ''}
                onChange={(e) => onChange({
                  ...action,
                  config: { ...action.config, auth_password: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {action.config?.auth_type === 'api_key' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold mb-2 block">Header Name</label>
              <Input
                placeholder="X-API-Key"
                value={action.config?.api_key_header || ''}
                onChange={(e) => onChange({
                  ...action,
                  config: { ...action.config, api_key_header: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">API Key</label>
              <Input
                type="password"
                value={action.config?.api_key_value || ''}
                onChange={(e) => onChange({
                  ...action,
                  config: { ...action.config, api_key_value: e.target.value }
                })}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}