import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, Code, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRuleApprovalPanel({ taxLawUpdateId }) {
  const [selectedConfigs, setSelectedConfigs] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const queryClient = useQueryClient();

  const { data: update, isLoading } = useQuery({
    queryKey: ['taxLawUpdate', taxLawUpdateId],
    queryFn: async () => {
      const updates = await base44.entities.TaxLawUpdate.filter(
        { id: taxLawUpdateId },
        '-updated_date',
        1
      );
      return updates[0];
    }
  });

  const handleDeploy = async () => {
    if (selectedConfigs.length === 0 && selectedRules.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Konfiguration oder Regel');
      return;
    }

    try {
      setDeploying(true);
      const response = await base44.functions.invoke('applyApprovedTaxSuggestions', {
        tax_law_update_id: taxLawUpdateId,
        approved_configs: selectedConfigs,
        approved_rules: selectedRules
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedConfigs([]);
        setSelectedRules([]);
        queryClient.invalidateQueries({ queryKey: ['taxLawUpdate', taxLawUpdateId] });
      }
    } catch (error) {
      toast.error(`Deployment fehlgeschlagen: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  }

  if (!update || update.status === 'IMPLEMENTED') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800">
          Diese Änderungen wurden bereits implementiert.
        </AlertDescription>
      </Alert>
    );
  }

  const suggestedConfigs = update.suggested_config_changes || [];
  const suggestedRules = update.suggested_rule_changes || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI-Vorschläge überprüfen</h3>
        <p className="text-sm text-slate-600">
          Genehmigen und implementieren Sie die von der KI vorgeschlagenen Steuerregeln und Konfigurationen.
        </p>
      </div>

      {/* Configuration Suggestions */}
      {suggestedConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Vorgeschlagene Konfigurationen ({suggestedConfigs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedConfigs.map((config, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedConfigs.includes(config.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedConfigs([...selectedConfigs, config.id]);
                      } else {
                        setSelectedConfigs(selectedConfigs.filter(id => id !== config.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{config.display_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {config.value_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{config.config_key}</p>
                    <div className="bg-slate-50 rounded p-2 text-xs">
                      <p><strong>Wert:</strong> {config.value} {config.unit || ''}</p>
                      {config.legal_reference && (
                        <p className="text-slate-600 mt-1"><strong>Referenz:</strong> {config.legal_reference}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rule Suggestions */}
      {suggestedRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-4 h-4" />
              Vorgeschlagene Regeln ({suggestedRules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedRules.map((rule, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedRules.includes(rule.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRules([...selectedRules, rule.id]);
                      } else {
                        setSelectedRules(selectedRules.filter(id => id !== rule.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{rule.display_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {rule.rule_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{rule.rule_code}</p>
                    <p className="text-xs text-slate-700 mb-2">{rule.description}</p>
                    {rule.legal_reference && (
                      <p className="text-xs text-slate-600"><strong>Referenz:</strong> {rule.legal_reference}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <p className="text-sm text-slate-700 mb-4">
            Ausgewählt: <strong>{selectedConfigs.length}</strong> Konfigurationen, <strong>{selectedRules.length}</strong> Regeln
          </p>
          <Button
            onClick={handleDeploy}
            disabled={deploying || (selectedConfigs.length === 0 && selectedRules.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {deploying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird bereitgestellt...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ausgewählte Änderungen genehmigen & bereitstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audit Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-800">
          Alle genehmigten Änderungen werden im Audit-Log protokolliert und können jederzeit überprüft werden.
        </AlertDescription>
      </Alert>
    </div>
  );
}