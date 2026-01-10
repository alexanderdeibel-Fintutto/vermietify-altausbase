import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Settings2, Zap } from 'lucide-react';

export default function WorkflowRulesList({ companyId }) {
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['workflow-rules', companyId],
    queryFn: async () => {
      const all = await base44.entities.DocumentWorkflowRule.filter({ company_id: companyId });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="w-5 h-5" />
          Aktive Regeln ({rules.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Keine Regeln erstellt</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-slate-900">{rule.name}</h4>
                    {rule.description && (
                      <p className="text-xs text-slate-600 mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="text-xs" variant="outline">
                        {rule.trigger_type === 'document_created' ? 'Bei Erstellung' : 'Zeitgesteuert'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {rule.execution_count || 0}x ausgeführt
                      </span>
                      {rule.last_executed && (
                        <span className="text-xs text-slate-500">
                          Zuletzt: {format(new Date(rule.last_executed), 'dd.MM.yy', { locale: de })}
                        </span>
                      )}
                    </div>
                  </div>
                  {rule.is_active && (
                    <Badge className="bg-green-100 text-green-700 text-xs">Aktiv</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}