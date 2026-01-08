import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Upload, TestTube, Archive } from 'lucide-react';

export default function QuickActionsCard({ 
  onCreateForm, 
  onUploadCertificate, 
  onImportCategories,
  onRunTest 
}) {
  const actions = [
    {
      icon: Sparkles,
      label: 'Formular erstellen',
      description: 'Neues Steuerformular mit KI',
      color: 'emerald',
      onClick: onCreateForm
    },
    {
      icon: Upload,
      label: 'Zertifikat hochladen',
      description: 'ELSTER-Zertifikat hinzufügen',
      color: 'blue',
      onClick: onUploadCertificate
    },
    {
      icon: FileText,
      label: 'Kategorien importieren',
      description: 'CSV-Import',
      color: 'purple',
      onClick: onImportCategories
    },
    {
      icon: TestTube,
      label: 'Verbindung testen',
      description: 'ELSTER-Verbindung prüfen',
      color: 'orange',
      onClick: onRunTest
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schnellaktionen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button
                key={idx}
                onClick={action.onClick}
                variant="outline"
                className={`h-auto flex-col items-start p-4 hover:bg-${action.color}-50 transition-colors`}
              >
                <Icon className={`w-5 h-5 text-${action.color}-600 mb-2`} />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-slate-600">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}