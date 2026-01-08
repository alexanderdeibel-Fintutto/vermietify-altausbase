import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ValidationPreview({ validationResult }) {
  if (!validationResult) return null;

  const { errors = [], warnings = [], infos = [], summary } = validationResult;

  const errorCount = errors.length;
  const warningCount = warnings.length;
  const infoCount = infos.length;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const isValid = errorCount === 0;

  return (
    <div className="space-y-4">
      <Card className={isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {isValid ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <div className={`font-medium ${isValid ? 'text-green-900' : 'text-red-900'}`}>
                {isValid ? 'Validierung erfolgreich' : 'Validierung fehlgeschlagen'}
              </div>
              <div className={`text-sm ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                {errorCount > 0 && `${errorCount} Fehler`}
                {warningCount > 0 && ` · ${warningCount} Warnungen`}
                {infoCount > 0 && ` · ${infoCount} Hinweise`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {summary}
          </AlertDescription>
        </Alert>
      )}

      {(errors.length > 0 || warnings.length > 0 || infos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validierungsdetails</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {errors.length > 0 && (
                <AccordionItem value="errors" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{errors.length}</Badge>
                      <span>Fehler</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {errors.map((error, idx) => {
                        const Icon = getSeverityIcon('error');
                        return (
                          <Alert key={idx} className={getSeverityBg('error')}>
                            <Icon className={`h-4 w-4 ${getSeverityColor('error')}`} />
                            <AlertDescription>
                              <div className="font-medium">{error.field || error.code}</div>
                              <div className="text-sm mt-1">{error.message}</div>
                              {error.suggestion && (
                                <div className="text-xs mt-2 p-2 bg-white rounded border">
                                  💡 {error.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {warnings.length > 0 && (
                <AccordionItem value="warnings" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-600">{warnings.length}</Badge>
                      <span>Warnungen</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {warnings.map((warning, idx) => {
                        const Icon = getSeverityIcon('warning');
                        return (
                          <Alert key={idx} className={getSeverityBg('warning')}>
                            <Icon className={`h-4 w-4 ${getSeverityColor('warning')}`} />
                            <AlertDescription>
                              <div className="font-medium">{warning.field || warning.code}</div>
                              <div className="text-sm mt-1">{warning.message}</div>
                            </AlertDescription>
                          </Alert>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {infos.length > 0 && (
                <AccordionItem value="infos" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{infos.length}</Badge>
                      <span>Hinweise</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {infos.map((info, idx) => {
                        const Icon = getSeverityIcon('info');
                        return (
                          <Alert key={idx} className={getSeverityBg('info')}>
                            <Icon className={`h-4 w-4 ${getSeverityColor('info')}`} />
                            <AlertDescription className="text-sm">
                              {info.message}
                            </AlertDescription>
                          </Alert>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}