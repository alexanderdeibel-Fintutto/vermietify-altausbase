import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NebenkostenPruefer() {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
            const base64 = reader.result.split(',')[1];
            setImage({ base64, type: file.type });
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setLoading(true);
        try {
            const response = await base44.functions.invoke('callClaudeAPI', {
                featureKey: 'nebenkosten',
                systemPrompt: 'Du bist ein Mietrechtsexperte. Prüfe Nebenkostenabrechnungen auf Fehler und nicht umlagefähige Kosten.',
                userPrompt: 'Prüfe diese Nebenkostenabrechnung. Gib zurück: grunddaten{abrechnungszeitraum_von, abrechnungszeitraum_bis, vorauszahlungen_gesamt, abrechnungsergebnis, ist_nachzahlung}, nicht_umlagefaehige_kosten[{bezeichnung, betrag, grund}], ergebnis{empfehlung: "akzeptieren"|"pruefen_lassen"|"widerspruch_einlegen", begruendung, ersparnis}, widerspruch_vorlage',
                imageBase64: image.base64,
                imageMediaType: image.type,
                responseSchema: true
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Nebenkostenabrechnung geprüft');
            } else {
                toast.error(response.data.error || 'Fehler bei der Prüfung');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getEmpfehlungColor = (empfehlung) => {
        switch (empfehlung) {
            case 'akzeptieren': return 'bg-green-50 border-green-200 text-green-800';
            case 'pruefen_lassen': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'widerspruch_einlegen': return 'bg-red-50 border-red-200 text-red-800';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>🏠 Nebenkostenabrechnung-Prüfer</CardTitle>
                    <p className="text-sm text-slate-600">Prüfe deine Nebenkostenabrechnung auf Fehler und nicht umlagefähige Kosten</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result && (
                        <>
                            <label>
                                <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <span><Upload className="w-4 h-4 mr-2" />Nebenkostenabrechnung hochladen</span>
                                </Button>
                            </label>

                            {imagePreview && (
                                <>
                                    <div className="border rounded-lg p-4 bg-slate-50">
                                        <img src={imagePreview} alt="Abrechnung" className="max-h-96 mx-auto" />
                                    </div>
                                    <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Prüfe Abrechnung...</> : 'Abrechnung prüfen'}
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-6">
                            {/* Ergebnis */}
                            <div className={`p-4 rounded-lg border ${getEmpfehlungColor(result.ergebnis?.empfehlung)}`}>
                                <div className="font-semibold mb-2 text-lg">
                                    Empfehlung: {result.ergebnis?.empfehlung?.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div className="text-sm mb-2">{result.ergebnis?.begruendung}</div>
                                {result.ergebnis?.ersparnis > 0 && (
                                    <div className="text-lg font-bold mt-2">
                                        Mögliche Ersparnis: {result.ergebnis?.ersparnis?.toFixed(2)} €
                                    </div>
                                )}
                            </div>

                            {/* Grunddaten */}
                            <div>
                                <h3 className="font-semibold mb-3">📋 Grunddaten</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-medium">Abrechnungszeitraum</div>
                                    <div>{result.grunddaten?.abrechnungszeitraum_von} bis {result.grunddaten?.abrechnungszeitraum_bis}</div>
                                    <div className="font-medium">Vorauszahlungen</div>
                                    <div>{result.grunddaten?.vorauszahlungen_gesamt?.toFixed(2)} €</div>
                                    <div className="font-medium">Ergebnis</div>
                                    <div className={result.grunddaten?.ist_nachzahlung ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                        {result.grunddaten?.ist_nachzahlung ? 'Nachzahlung' : 'Guthaben'}: {Math.abs(result.grunddaten?.abrechnungsergebnis || 0).toFixed(2)} €
                                    </div>
                                </div>
                            </div>

                            {/* Nicht umlagefähige Kosten */}
                            {result.nicht_umlagefaehige_kosten?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-red-600">⚠️ Nicht umlagefähige Kosten gefunden!</h3>
                                    <div className="space-y-2">
                                        {result.nicht_umlagefaehige_kosten.map((kosten, idx) => (
                                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="font-medium">{kosten.bezeichnung}: {kosten.betrag?.toFixed(2)} €</div>
                                                <div className="text-sm text-slate-600">{kosten.grund}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Widerspruchsvorlage */}
                            {result.widerspruch_vorlage && (
                                <div>
                                    <h3 className="font-semibold mb-3">✉️ Widerspruch-Vorlage</h3>
                                    <div className="p-4 bg-slate-50 border rounded-lg text-sm whitespace-pre-wrap font-mono">
                                        {result.widerspruch_vorlage}
                                    </div>
                                </div>
                            )}

                            <Button variant="outline" onClick={() => { setResult(null); setImage(null); setImagePreview(null); }}>
                                Neue Prüfung
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}