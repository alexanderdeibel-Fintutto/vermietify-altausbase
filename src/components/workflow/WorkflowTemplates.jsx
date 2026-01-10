import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileArchive, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function WorkflowTemplates({ onSelect }) {
  const templates = [
    {
      name: 'Automatische Mahnung - Kaution nicht bezahlt',
      description: 'Sendet automatisch eine Mahnung, wenn die Kaution 7 Tage nach Vertragsbeginn nicht eingegangen ist',
      category: 'payment',
      icon: Mail,
      color: 'bg-red-600',
      workflow: {
        name: 'Automatische Mahnung - Kaution nicht bezahlt',
        description: 'Mahnung bei fehlender Kaution',
        trigger_type: 'scheduled',
        trigger_config: { cron: '0 9 * * *' },
        category: 'payment',
        conditions: [
          { entity: 'LeaseContract', field: 'deposit_paid', operator: 'equals', value: 'false' },
          { entity: 'LeaseContract', field: 'start_date', operator: 'before_days', value: '7' }
        ],
        actions: [
          {
            type: 'send_email',
            config: {
              recipient_field: 'tenant.email',
              subject: 'Erinnerung: Kaution noch ausstehend',
              body: 'Sehr geehrte(r) {{tenant.first_name}} {{tenant.last_name}},\n\nwir möchten Sie daran erinnern, dass die Kaution für Ihre Wohnung noch nicht eingegangen ist.\n\nBitte überweisen Sie den Betrag von {{contract.deposit}}€ zeitnah.'
            }
          },
          {
            type: 'create_task',
            config: {
              task_title: 'Kaution bei {{tenant.first_name}} {{tenant.last_name}} nachverfolgen',
              description: 'Kaution wurde gemahnt, Zahlungseingang prüfen'
            }
          }
        ]
      }
    },
    {
      name: 'Folgeaufgaben bei Vertragsende',
      description: 'Erstellt automatisch Aufgaben für Wohnungsübergabe, Endreinigung und Nachmieter-Suche 60 Tage vor Vertragsende',
      category: 'contract',
      icon: CheckCircle,
      color: 'bg-blue-600',
      workflow: {
        name: 'Folgeaufgaben bei Vertragsende',
        description: 'Automatische Task-Erstellung vor Vertragsende',
        trigger_type: 'scheduled',
        trigger_config: { cron: '0 9 * * *' },
        category: 'contract',
        conditions: [
          { entity: 'LeaseContract', field: 'end_date', operator: 'in_next_days', value: '60' }
        ],
        actions: [
          {
            type: 'create_task',
            config: {
              task_title: 'Wohnungsübergabe planen - {{unit.name}}',
              description: 'Termin mit {{tenant.first_name}} {{tenant.last_name}} für Wohnungsübergabe vereinbaren. Vertragsende: {{contract.end_date}}'
            }
          },
          {
            type: 'create_task',
            config: {
              task_title: 'Endreinigung organisieren - {{unit.name}}',
              description: 'Reinigungsfirma für Endreinigung nach Auszug buchen'
            }
          },
          {
            type: 'create_task',
            config: {
              task_title: 'Nachmieter-Suche starten - {{unit.name}}',
              description: 'Inserat schalten und Besichtigungen planen'
            }
          }
        ]
      }
    },
    {
      name: 'Dokument-Archivierung nach KI-Kategorisierung',
      description: 'Archiviert Dokumente automatisch basierend auf KI-Kategorie und Alter',
      category: 'document',
      icon: FileArchive,
      color: 'bg-purple-600',
      workflow: {
        name: 'Dokument-Archivierung nach KI-Kategorisierung',
        description: 'Automatische Archivierung alter Dokumente',
        trigger_type: 'scheduled',
        trigger_config: { cron: '0 2 * * 0' },
        category: 'document',
        conditions: [
          { entity: 'Document', field: 'ai_processed', operator: 'equals', value: 'true' },
          { entity: 'Document', field: 'ai_category', operator: 'equals', value: 'Rechnung' },
          { entity: 'Document', field: 'created_date', operator: 'before_days', value: '365' },
          { entity: 'Document', field: 'is_archived', operator: 'equals', value: 'false' }
        ],
        actions: [
          {
            type: 'archive_document',
            config: {
              reason: 'Automatische Archivierung nach 1 Jahr (KI-kategorisiert als Rechnung)'
            }
          },
          {
            type: 'send_notification',
            config: {
              title: 'Dokumente archiviert',
              message: '{{count}} Rechnungen wurden automatisch archiviert'
            }
          }
        ]
      }
    },
    {
      name: 'Mieterhöhung ankündigen',
      description: 'Erinnert automatisch daran, Mieterhöhungen 3 Monate im Voraus anzukündigen',
      category: 'contract',
      icon: AlertCircle,
      color: 'bg-orange-600',
      workflow: {
        name: 'Mieterhöhung ankündigen',
        description: 'Erinnerung für Mieterhöhungs-Ankündigung',
        trigger_type: 'scheduled',
        trigger_config: { cron: '0 9 1 * *' },
        category: 'contract',
        conditions: [
          { entity: 'LeaseContract', field: 'start_date', operator: 'before_days', value: '365' }
        ],
        actions: [
          {
            type: 'create_task',
            config: {
              task_title: 'Mieterhöhung prüfen - {{tenant.first_name}} {{tenant.last_name}}',
              description: 'Prüfen, ob Mieterhöhung möglich und wirtschaftlich sinnvoll. Bei Bedarf formell ankündigen (3 Monate Vorlauf).'
            }
          }
        ]
      }
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((template, idx) => {
        const Icon = template.icon;
        return (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge className="mt-2" variant="outline">{template.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{template.description}</p>
              <Button
                onClick={() => onSelect(template.workflow)}
                className="w-full"
                variant="outline"
              >
                Template verwenden
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}