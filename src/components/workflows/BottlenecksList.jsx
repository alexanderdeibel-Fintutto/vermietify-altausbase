import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Lightbulb } from 'lucide-react';

export default function BottlenecksList({ bottlenecks, suggestions, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Bottlenecks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Kritische Engpässe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bottlenecks.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Engpässe erkannt</p>
          ) : (
            <div className="space-y-2">
              {bottlenecks.slice(0, 5).map((bn, idx) => (
                <Alert
                  key={idx}
                  variant={bn.severity === 'critical' ? 'destructive' : 'default'}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium text-sm">{bn.step_id}</p>
                    <p className="text-xs mt-1">
                      {bn.type === 'slow_step'
                        ? `Durchschnittsdauer: ${bn.average_duration}s`
                        : `Fehlerrate: ${bn.failure_rate}%`}
                    </p>
                    <Badge className={bn.severity === 'critical' ? 'mt-2 bg-red-100 text-red-700' : 'mt-2 bg-yellow-100 text-yellow-700'}>
                      {bn.severity}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Optimierungsvorschläge
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Vorschläge verfügbar</p>
          ) : (
            <div className="space-y-3">
              {suggestions.slice(0, 4).map((sugg, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="font-medium text-sm text-blue-900">{sugg.title}</p>
                  <p className="text-xs text-blue-700 mt-1">{sugg.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {sugg.estimated_improvement}
                    </Badge>
                    <Badge
                      className={
                        sugg.priority === 'critical'
                          ? 'bg-red-100 text-red-700 text-xs'
                          : 'bg-yellow-100 text-yellow-700 text-xs'
                      }
                    >
                      {sugg.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}