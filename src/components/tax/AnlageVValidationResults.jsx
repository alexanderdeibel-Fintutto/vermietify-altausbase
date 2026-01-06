import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AnlageVValidationResults({ validation, kritischeFehler = [], warnungen = [], hinweise = [] }) {
    if (!validation) return null;

    return (
        <div className="space-y-4">
            {/* Kritische Fehler */}
            {kritischeFehler.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-900 mb-3">Kritische Fehler</h4>
                                <div className="space-y-3">
                                    {kritischeFehler.map((fehler, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                                            <p className="font-medium text-red-900 mb-1">{fehler.message}</p>
                                            <p className="text-sm text-red-700 mb-2">{fehler.fix}</p>
                                            {fehler.field && (
                                                <Badge variant="outline" className="text-xs border-red-300">
                                                    Feld: {fehler.field}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warnungen */}
            {warnungen.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-900 mb-3">Warnungen</h4>
                                <div className="space-y-3">
                                    {warnungen.map((warnung, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-3 border border-yellow-200">
                                            <p className="font-medium text-yellow-900 mb-1">{warnung.message}</p>
                                            {warnung.detail && (
                                                <p className="text-sm text-yellow-700 mb-1">{warnung.detail}</p>
                                            )}
                                            {warnung.impact && (
                                                <p className="text-xs text-yellow-600 italic">{warnung.impact}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Optimierungshinweise */}
            {hinweise.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 mb-3">Optimierungshinweise</h4>
                                <div className="space-y-3">
                                    {hinweise.map((hinweis, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                                            <p className="font-medium text-blue-900 mb-1">{hinweis.message}</p>
                                            {hinweis.detail && (
                                                <p className="text-sm text-blue-700 mb-1">{hinweis.detail}</p>
                                            )}
                                            {hinweis.action && (
                                                <p className="text-xs text-blue-600 mt-2">💡 {hinweis.action}</p>
                                            )}
                                            {hinweis.potential_savings && (
                                                <Badge className="bg-blue-600 mt-2">
                                                    Ersparnis: {hinweis.potential_savings.toLocaleString('de-DE')} €
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alles OK */}
            {kritischeFehler.length === 0 && warnungen.length === 0 && hinweise.length === 0 && (
                <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <AlertDescription className="text-emerald-800">
                        Alle Prüfungen erfolgreich - keine Probleme gefunden!
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}