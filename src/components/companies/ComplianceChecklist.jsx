import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

const complianceRequirements = {
  einzelunternehmen: [
    { task: 'Gewerbeanmeldung', type: 'required', deadline: null },
    { task: 'Steuernummer beantragen', type: 'required', deadline: null },
    { task: 'Versicherungen', type: 'recommended', deadline: null }
  ],
  gbr: [
    { task: 'Gesellschaftervertrag', type: 'required', deadline: null },
    { task: 'Gewerbeanmeldung', type: 'required', deadline: null },
    { task: 'Handelsregisteranmeldung', type: 'required', deadline: null },
    { task: 'Steuernummer für GbR', type: 'required', deadline: null },
    { task: 'Gemeinsame Konten', type: 'recommended', deadline: null }
  ],
  gmbh: [
    { task: 'Notarielle Beurkundung', type: 'required', deadline: null },
    { task: 'Handelsregisteranmeldung', type: 'required', deadline: null },
    { task: 'Geschäftskonten', type: 'required', deadline: null },
    { task: 'Steuernummer beantragen', type: 'required', deadline: null },
    { task: 'Sozialversicherung Geschäftsführer', type: 'required', deadline: null },
    { task: 'Jahresabschluss & Gewinnabführung', type: 'required', deadline: '31.12' },
    { task: 'Quartalsversteuerte Umsatzsteuer', type: 'required', deadline: '10. jeden Monats' }
  ],
  ag: [
    { task: 'Satzung notariell beglaubigt', type: 'required', deadline: null },
    { task: 'Handelsregistereintrag', type: 'required', deadline: null },
    { task: 'Grundkapitaleinzahlung', type: 'required', deadline: null },
    { task: 'Aufsichtsrat (optional)', type: 'recommended', deadline: null },
    { task: 'Jahresabschluss & Bericht', type: 'required', deadline: '31.05' },
    { task: 'Gesellschafterversammlung', type: 'required', deadline: '31.08' }
  ],
  ev: [
    { task: 'Satzung verfassen', type: 'required', deadline: null },
    { task: 'Vereinsregisteranmeldung', type: 'required', deadline: null },
    { task: 'Gemeinnützigkeitsbescheinigung', type: 'recommended', deadline: null },
    { task: 'Mitgliederversammlung (mind. 1x/Jahr)', type: 'required', deadline: '31.12' },
    { task: 'Jahresbericht', type: 'required', deadline: '31.12' }
  ]
};

export default function ComplianceChecklist({ legalForm, completedTasks = [], onTaskComplete }) {
  const requirements = complianceRequirements[legalForm] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="w-5 h-5" />
          Compliance-Checkliste ({legalForm})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requirements.map((req, idx) => {
          const isCompleted = completedTasks.includes(req.task);
          
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onTaskComplete?.(req.task)}
            >
              <div className="flex items-start gap-3">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-300 rounded-full mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {req.task}
                    </p>
                    <Badge
                      className={`text-xs ${
                        req.type === 'required'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {req.type === 'required' ? 'Pflicht' : 'Empfohlen'}
                    </Badge>
                  </div>
                  {req.deadline && (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                      <Clock className="w-3 h-3" />
                      Frist: {req.deadline}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            💡 Tipp: Klicken Sie auf eine Aufgabe um sie als erledigt zu markieren.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}