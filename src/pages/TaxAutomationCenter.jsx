import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Zap, Clock, CheckCircle2 } from 'lucide-react';

export default function TaxAutomationCenter() {
  const [country, setCountry] = useState('DE');
  const [businessType, setBusinessType] = useState('individual');
  const [setting, setSetting] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxAutomation', country, businessType],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxAutomationRules', {
        country,
        businessType
      });
      return response.data?.automation || {};
    },
    enabled: setting
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">⚙️ Steuer-Automatisierungs-Zentrum</h1>
        <p className="text-slate-500 mt-1">Intelligente Workflows zur Steuerverwaltung</p>
      </div>

      {/* Configuration */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Automatisierung konfigurieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={setting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Geschäftstyp</label>
              <Select value={businessType} onValueChange={setBusinessType} disabled={setting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Einzelperson</SelectItem>
                  <SelectItem value="freelance">Freiberufler</SelectItem>
                  <SelectItem value="business">Unternehmen</SelectItem>
                  <SelectItem value="corporate">Körperschaft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <button
            onClick={() => setSetting(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={setting}
          >
            {setting ? '⏳ Wird konfiguriert...' : 'Automatisierung einrichten'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Konfiguration läuft...</div>
      ) : setting && result.content ? (
        <>
          {/* Time Savings */}
          {result.content?.estimated_time_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Geschätzte Zeitersparnis pro Jahr</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {Math.round(result.content.estimated_time_savings)} Stunden
                </p>
              </CardContent>
            </Card>
          )}

          {/* Automation Rules */}
          {(result.content?.automation_rules || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Automatisierungsregeln
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.content.automation_rules.map((rule, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded border-l-4 border-blue-400">
                    <p className="font-medium text-sm">{rule.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{rule.description}</p>
                    {rule.frequency && <p className="text-xs text-slate-500 mt-1">📅 {rule.frequency}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Workflows */}
          {(result.content?.workflows || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Automatisierte Workflows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.content.workflows.map((workflow, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded border-l-4 border-purple-400">
                    <p className="font-medium text-sm">{workflow.name}</p>
                    {workflow.steps && (
                      <ol className="text-xs text-slate-600 mt-2 ml-4 list-decimal">
                        {workflow.steps.map((step, j) => (
                          <li key={j}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(result.content?.implementation_steps || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Implementierungsschritte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.implementation_steps.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie Ihre Konfiguration und klicken Sie "Automatisierung einrichten"
        </div>
      )}
    </div>
  );
}