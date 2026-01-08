import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function PlausibilityCheck({ result }) {
  if (!result) return null;

  const { plausibility_score, issues, warnings, benchmarks, industry_benchmarks } = result;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      <Card className={getScoreBg(plausibility_score)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {plausibility_score >= 90 ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            )}
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(plausibility_score)}`}>
                {plausibility_score}%
              </div>
              <div className="text-sm text-slate-600">Plausibilitäts-Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Kritische Probleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.map((issue, idx) => (
              <Alert key={idx} className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="font-medium">{issue.message}</div>
                  {issue.suggestion && (
                    <div className="text-sm mt-1 text-slate-600">{issue.suggestion}</div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warnungen & Hinweise</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {warnings.map((warning, idx) => (
                <AccordionItem key={idx} value={`warning-${idx}`} className="border-b last:border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-left">
                      {warning.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm">{warning.message}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="text-sm text-slate-600 pl-6">
                      💡 {warning.suggestion}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {benchmarks && Object.keys(benchmarks).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Branchenvergleich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {benchmarks.income_per_sqm && (
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-sm text-slate-600">Einnahmen pro qm</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-bold">{benchmarks.income_per_sqm.toFixed(2)} €</div>
                  <Badge variant="outline" className="text-xs">
                    Ø {industry_benchmarks.income_per_sqm?.avg} €
                  </Badge>
                </div>
              </div>
            )}

            {benchmarks.cost_ratio && (
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-sm text-slate-600">Kostenquote</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-bold">{(benchmarks.cost_ratio * 100).toFixed(1)}%</div>
                  <Badge variant="outline" className="text-xs">
                    Ø {(industry_benchmarks.total_costs_ratio?.avg * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}