import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WorkflowRuleBuilder from '@/components/workflows/WorkflowRuleBuilder';
import WorkflowRulesList from '@/components/workflows/WorkflowRulesList';
import { Zap, BookOpen } from 'lucide-react';

export default function WorkflowAutomationCenter() {
  const [companyId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('company_id') || 'all';
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-8 h-8" />
          Workflow-Automatisierung
        </h1>
        <p className="text-slate-600 mt-1">Erstellen Sie benutzerdefinierte Regeln für automatische Dokumentenverarbeitung</p>
      </div>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Automatisieren Sie Ihre Dokumentenprozesse</p>
              <ul className="space-y-1 text-xs">
                <li>• Automatische Aufgabenerstellung basierend auf Dokumenttyp</li>
                <li>• Automatische Archivierung alter Dokumente</li>
                <li>• Tag-basierte Automatisierungen</li>
                <li>• Metadaten-gesteuerte Aktionen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Neue Regel</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowRuleBuilder companyId={companyId} />
        </CardContent>
      </Card>

      {/* Rules List */}
      <WorkflowRulesList companyId={companyId} />
    </div>
  );
}