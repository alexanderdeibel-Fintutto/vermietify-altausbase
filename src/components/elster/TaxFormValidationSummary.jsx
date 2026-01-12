import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TaxFormValidationSummary({ errors = [], warnings = [], onJumpToField }) {
    if (errors.length === 0 && warnings.length === 0) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="py-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-medium text-green-900">Keine Validierungsfehler</p>
                            <p className="text-sm text-green-700">Das Formular ist bereit zur Übermittlung</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200">
            <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-3">
                    Validierung
                    <div className="flex gap-2">
                        {errors.length > 0 && (
                            <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {errors.length} Fehler
                            </Badge>
                        )}
                        {warnings.length > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {warnings.length} Warnungen
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {errors.map((error, idx) => (
                    <div 
                        key={`error-${idx}`}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">{error}</p>
                        </div>
                        {onJumpToField && error.includes('Zeile') && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    const match = error.match(/Zeile (\d+)/);
                                    if (match) onJumpToField(`zeile_${match[1]}`);
                                }}
                                className="text-xs"
                            >
                                Zur Zeile
                            </Button>
                        )}
                    </div>
                ))}

                {warnings.map((warning, idx) => (
                    <div 
                        key={`warning-${idx}`}
                        className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-yellow-900">{warning}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}