import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, CheckCircle, Send, Archive } from 'lucide-react';

export default function SubmissionTimeline({ submissions }) {
  const sortedSubmissions = [...submissions].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  const timelineEvents = sortedSubmissions.flatMap(sub => {
    const events = [];
    
    if (sub.created_date) {
      events.push({
        date: sub.created_date,
        type: 'created',
        submission: sub,
        icon: FileText,
        color: 'blue'
      });
    }
    
    if (sub.status === 'AI_PROCESSED') {
      events.push({
        date: sub.created_date,
        type: 'ai_processed',
        submission: sub,
        icon: Sparkles,
        color: 'purple'
      });
    }
    
    if (sub.status === 'VALIDATED') {
      events.push({
        date: sub.created_date,
        type: 'validated',
        submission: sub,
        icon: CheckCircle,
        color: 'green'
      });
    }
    
    if (sub.submission_date) {
      events.push({
        date: sub.submission_date,
        type: 'submitted',
        submission: sub,
        icon: Send,
        color: 'indigo'
      });
    }
    
    if (sub.archived_at) {
      events.push({
        date: sub.archived_at,
        type: 'archived',
        submission: sub,
        icon: Archive,
        color: 'slate'
      });
    }
    
    return events;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const eventLabels = {
    created: 'Formular erstellt',
    ai_processed: 'KI-Verarbeitung',
    validated: 'Validiert',
    submitted: 'An ELSTER übermittelt',
    archived: 'GoBD-Archiviert'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
          
          {timelineEvents.map((event, idx) => {
            const Icon = event.icon;
            return (
              <div key={idx} className="relative flex gap-4">
                <div className={`z-10 w-8 h-8 rounded-full bg-${event.color}-100 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${event.color}-600`} />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{eventLabels[event.type]}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.submission.tax_form_type}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(event.date).toLocaleString('de-DE')}
                  </div>
                  {event.submission.building_id && (
                    <div className="text-xs text-slate-500 mt-1">
                      Gebäude: {event.submission.building_id.substring(0, 8)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {timelineEvents.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              Noch keine Aktivitäten
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}