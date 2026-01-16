import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RenditeAnalyse() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const daten = {
            kaufpreis: parseFloat(formData.get('kaufpreis')),
            wohnflaeche: parseFloat(formData.get('wohnflaeche')),
            baujahr: parseInt(formData.get('baujahr')),
            bundesland: formData.get('bundesland'),
            kaltmiete: parseFloat(formData.get('kaltmiete')),
            hausgeld: parseFloat(formData.get('hausgeld')),
            eigenkapital: parseFloat(formData.get('eigenkapital')),
            zinssatz: parseFloat(formData.get('zinssatz')),
            tilgung: parseFloat(formData.get('tilgung'))
        };

        setLoading(true);
        try {
            const response = await base44.functions.invoke('callClaudeAPI', {
                featureKey: 'rendite',
                systemPrompt: 'Du bist ein Immobilieninvestment-Experte. Berechne alle wichtigen Renditekennzahlen.',
                userPrompt: `Analysiere diese Immobilie: ${JSON.stringify(daten)}. Berechne: renditen{bruttomietrendite, nettomietrendite, eigenkapitalrendite, cashflow_monatlich, cashflow_jaehrlich}, bewertung{gesamtnote: "sehr_gut"|"gut"|"mittel"|"schlecht", empfehlung: "kaufen"|"pruefen"|"ablehnen", begruendung, staerken[], risiken[]}`,
                responseSchema: true
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Rendite-Analyse abgeschlossen');
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
                        <TrendingUp className="w-5 h-5" />
                        Immobilien-Rendite-Analyse
                    </CardTitle>
                    <p className="text-sm text-slate-600">Berechne alle Kennzahlen für deine Kaufentscheidung</p>
                </CardHeader>
                <CardContent>
                    {!result && (
                        <form onSubmit={handleAnalyze} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Kaufpreis (€)</Label>
                                    <Input name="kaufpreis" type="number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Wohnfläche (qm)</Label>
                                    <Input name="wohnflaeche" type="number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Baujahr</Label>
                                    <Input name="baujahr" type="number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bundesland</Label>
                                    <Input name="bundesland" placeholder="z.B. Bayern" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kaltmiete (€/Monat)</Label>
                                    <Input name="kaltmiete" type="number" step="0.01" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hausgeld (€/Monat)</Label>
                                    <Input name="hausgeld" type="number" step="0.01" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Eigenkapital (€)</Label>
                                    <Input name="eigenkapital" type="number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Zinssatz (%)</Label>
                                    <Input name="zinssatz" type="number" step="0.01" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tilgung (%)</Label>
                                    <Input name="tilgung" type="number" step="0.01" required />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Berechne Rendite...</> : 'Rendite berechnen'}
                            </Button>
                        </form>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-lg border ${
                                result.bewertung?.gesamtnote === 'sehr_gut' ? 'bg-green-50 border-green-200' :
                                result.bewertung?.gesamtnote === 'gut' ? 'bg-blue-50 border-blue-200' :
                                result.bewertung?.gesamtnote === 'mittel' ? 'bg-orange-50 border-orange-200' :
                                'bg-red-50 border-red-200'
                            }`}>
                                <div className="text-2xl font-bold mb-2">
                                    Bewertung: {result.bewertung?.gesamtnote?.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div className="text-lg mb-2">
                                    Empfehlung: <span className="font-semibold">{result.bewertung?.empfehlung?.toUpperCase()}</span>
                                </div>
                                <div className="text-sm">{result.bewertung?.begruendung}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{result.renditen?.bruttomietrendite?.toFixed(2)}%</div>
                                        <div className="text-sm text-slate-600">Bruttomietrendite</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{result.renditen?.nettomietrendite?.toFixed(2)}%</div>
                                        <div className="text-sm text-slate-600">Nettomietrendite</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{result.renditen?.eigenkapitalrendite?.toFixed(2)}%</div>
                                        <div className="text-sm text-slate-600">Eigenkapitalrendite</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">💰 Cashflow</h3>
                                <div className={`text-2xl font-bold ${result.renditen?.cashflow_monatlich >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.renditen?.cashflow_monatlich?.toFixed(2)} € / Monat
                                </div>
                                <div className="text-sm text-slate-600">{result.renditen?.cashflow_jaehrlich?.toFixed(2)} € / Jahr</div>
                            </div>

                            {result.bewertung?.staerken?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 text-green-600">✅ Stärken</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {result.bewertung.staerken.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.bewertung?.risiken?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 text-red-600">⚠️ Risiken</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {result.bewertung.risiken.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

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