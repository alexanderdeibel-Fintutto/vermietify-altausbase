import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const suggestions = [
  {
    icon: TrendingUp,
    title: 'Monatliche Einnahmen',
    description: 'Übersicht der Mieteinnahmen diesen Monat',
    templateId: 'monthly-financial',
    color: 'bg-green-100'
  },
  {
    icon: Users,
    title: 'Mieterverwaltung',
    description: 'Status und Statistiken aller Mieter',
    templateId: 'tenant-overview',
    color: 'bg-purple-100'
  },
  {
    icon: AlertCircle,
    title: 'Überfällige Aufgaben',
    description: 'Aufgaben, die ihre Deadline überschritten haben',
    templateId: 'overdue-tasks',
    color: 'bg-red-100'
  }
];

export default function ReportSuggestionsWidget() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-5 h-5" />
          Empfohlene Berichte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div
                key={suggestion.templateId}
                className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className={`p-2 rounded ${suggestion.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{suggestion.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{suggestion.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-7"
                  onClick={() => {
                    navigate(createPageUrl('ReportBuilder'));
                  }}
                >
                  Anzeigen
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}