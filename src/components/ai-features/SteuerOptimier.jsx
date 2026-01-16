import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function SteuerOptimier() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleOptimize = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const situation = {
            immobilien_anzahl: parseInt(formData.get('immobilien_anzahl')) || 0,
            jahreseinkommen: parseFloat(formData.get('jahreseinkommen')) || 0,
            finanziert: formData.get('finanziert') === 'ja',
            zusatzinfo: formData.get('zusatzinfo')
        };

        setLoading(true);
        try {
            const response = await base44.functions.invoke('callClaudeAPI', {
                featureKey: 'steuer_optimierung',
                systemPrompt: 'Du bist ein Steuerberater. Finde legale Optimierungsmöglichkeiten.',
                userPrompt: `Optimiere die Steuersituation: ${JSON.stringify(situation)}. Gib zurück: optimierungspotenzial[{bereich, beschreibung, ersparnis_geschaetzt, aufwand, umsetzung, tipp}], checkliste_jahresende[{aktion, frist, potenzial}], disclaimer`,
                responseSchema: true
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Optimierungsvorschläge erstellt');
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
                        <Lightbulb className="w-5 h-5" />
                        Steuer-Optimierer
                    </CardTitle>
                    <p className="text-sm text-slate-600">Entdecke legale Steuerspar-Möglichkeiten</p>
                </CardHeader>
                <CardContent>
                    {!result && (
                        <form onSubmit={handleOptimize} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Anzahl Immobilien</Label>
                                    <Input name="immobilien_anzahl" type="number" defaultValue="1" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Jahreseinkommen aus Vermietung (€)</Label>
                                    <Input name="jahreseinkommen" type="number" step="0.01" required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Finanziert?</Label>
                                    <Select name="finanziert" defaultValue="ja">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ja">Ja</SelectItem>
                                            <SelectItem value="nein">Nein</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Zusätzliche Informationen</Label>
                                <Textarea name="zusatzinfo" rows={3} placeholder="z.B. Modernisierung geplant, hohe Instandhaltungskosten..." />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysiere...</> : 'Optimierungspotenzial zeigen'}
                            </Button>
                        </form>
                    )}

                    {result && (
                        <div className="space-y-6">
                            {result.optimierungspotenzial?.map((opt, idx) => (
                                <Card key={idx}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            {opt.bereich}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-sm">{opt.beschreibung}</p>
                                        <div className="flex gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-green-600">Ersparnis: </span>
                                                {opt.ersparnis_geschaetzt}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Aufwand: </span>
                                                {opt.aufwand}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Umsetzung: </span>
                                                {opt.umsetzung}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                            💡 {opt.tipp}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {result.checkliste_jahresende?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Checkliste Jahresende
                                    </h3>
                                    <div className="space-y-2">
                                        {result.checkliste_jahresende.map((item, idx) => (
                                            <div key={idx} className="p-3 border rounded-lg">
                                                <div className="font-medium">{item.aktion}</div>
                                                <div className="text-sm text-slate-600">Frist: {item.frist} | {item.potenzial}</div>
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