import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioAnalyse() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('analysierePortfolio', {});

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Portfolio analysiert');
            } else {
                toast.error(response.data.error || 'Fehler bei der Analyse');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Portfolio-Analyse
                    </CardTitle>
                    <p className="text-sm text-slate-600">Analysiere dein gesamtes Immobilien-Portfolio strategisch</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result && (
                        <div className="text-center py-8">
                            <p className="text-slate-600 mb-4">Ich analysiere automatisch alle deine Immobilien</p>
                            <Button onClick={handleAnalyze} disabled={loading}>
                                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysiere Portfolio...</> : 'Portfolio analysieren'}
                            </Button>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{result.portfolio_uebersicht?.anzahl_objekte || 0}</div>
                                        <div className="text-sm text-slate-600">Objekte</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{(result.portfolio_uebersicht?.gesamtwert_geschaetzt || 0).toLocaleString('de-DE')} €</div>
                                        <div className="text-sm text-slate-600">Gesamtwert</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{result.portfolio_uebersicht?.durchschnittliche_rendite?.toFixed(2)}%</div>
                                        <div className="text-sm text-slate-600">Ø Rendite</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">🎯 Diversifikation</h3>
                                <div className={`p-4 rounded-lg border ${
                                    result.diversifikation?.bewertung === 'gut' ? 'bg-green-50 border-green-200' :
                                    result.diversifikation?.bewertung === 'mittel' ? 'bg-orange-50 border-orange-200' :
                                    'bg-red-50 border-red-200'
                                }`}>
                                    <div className="font-medium mb-2">Bewertung: {result.diversifikation?.bewertung?.toUpperCase()}</div>
                                    <div className="text-sm">{result.diversifikation?.kommentar}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">⚠️ Risiko-Analyse</h3>
                                <div className="p-4 bg-slate-50 border rounded-lg">
                                    <div className="mb-2">
                                        <span className="font-medium">Gesamtrisiko: </span>
                                        <span className={
                                            result.risiko_analyse?.gesamtrisiko === 'niedrig' ? 'text-green-600 font-semibold' :
                                            result.risiko_analyse?.gesamtrisiko === 'mittel' ? 'text-orange-600 font-semibold' :
                                            'text-red-600 font-semibold'
                                        }>
                                            {result.risiko_analyse?.gesamtrisiko?.toUpperCase()}
                                        </span>
                                    </div>
                                    {result.risiko_analyse?.klumpenrisiken?.length > 0 && (
                                        <div className="mt-3">
                                            <div className="font-medium mb-1">Klumpenrisiken:</div>
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {result.risiko_analyse.klumpenrisiken.map((risiko, idx) => (
                                                    <li key={idx}>{risiko}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {result.empfehlungen?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">💡 Empfehlungen</h3>
                                    <div className="space-y-3">
                                        {result.empfehlungen.map((emp, idx) => (
                                            <div key={idx} className={`p-3 border-l-4 ${
                                                emp.prioritaet === 'hoch' ? 'border-red-500 bg-red-50' :
                                                emp.prioritaet === 'mittel' ? 'border-orange-500 bg-orange-50' :
                                                'border-blue-500 bg-blue-50'
                                            } rounded`}>
                                                <div className="font-medium">{emp.bereich}</div>
                                                <div className="text-sm mt-1">{emp.empfehlung}</div>
                                                <div className="text-xs text-slate-600 mt-1">{emp.begruendung}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
                                {result.disclaimer}
                            </div>

                            <Button variant="outline" onClick={() => setResult(null)}>
                                Neue Analyse
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}