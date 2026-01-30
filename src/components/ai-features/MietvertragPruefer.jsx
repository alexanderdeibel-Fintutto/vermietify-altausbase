import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import AIUsageIndicator from '../ai/AIUsageIndicator';
import AICostDisplay from '../ai/AICostDisplay';

export default function MietvertragPruefer() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [user, setUser] = useState(null);
    const [usageStats, setUsageStats] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
    }

    const handleFilesSelect = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const promises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve({ base64, type: file.type, preview: reader.result });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(setImages);
    };

    const handleAnalyze = async () => {
        if (!images.length) return;

        setLoading(true);
        try {
            const response = await base44.functions.invoke('aiCoreService', {
                action: 'analysis',
                prompt: 'Prüfe diesen Mietvertrag. Gib zurück: zusammenfassung{kaltmiete, nebenkosten, kaution, mietbeginn}, klauseln[{thema, bewertung: "ok"|"achtung"|"unwirksam", erklaerung, handlungsempfehlung}], bewertung{gesamtnote: "gut"|"mittel"|"schlecht", kurzfassung}',
                systemPrompt: 'Du bist ein Fachanwalt für Mietrecht. Prüfe alle Klauseln auf Rechtmäßigkeit.',
                imageBase64: images[0].base64,
                imageMediaType: images[0].type,
                userId: user?.email,
                featureKey: 'analysis',
                maxTokens: 4096
            });

            if (response.data.success) {
                const parsed = JSON.parse(response.data.content);
                setResult(parsed);
                setUsageStats(response.data.usage);
                toast.success('Mietvertrag geprüft');
            } else {
                toast.error(response.data.error || 'Fehler bei der Prüfung');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getBewertungIcon = (bewertung) => {
        switch (bewertung) {
            case 'ok': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'achtung': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
            case 'unwirksam': return <XCircle className="w-5 h-5 text-red-600" />;
            default: return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Mietvertrag-Prüfer
                        </div>
                        {user && <AIUsageIndicator userId={user.email} />}
                    </CardTitle>
                    <p className="text-sm text-slate-600">Lade alle Seiten hoch - ich prüfe jede Klausel</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!result && (
                        <>
                            <label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    multiple
                                    onChange={handleFilesSelect}
                                    className="hidden"
                                />
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Vertragsseiten hochladen
                                    </span>
                                </Button>
                            </label>

                            {images.length > 0 && (
                                <>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-2">Hochgeladen: {images.length} Seite(n)</p>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {images.map((img, idx) => (
                                                <img key={idx} src={img.preview} alt={`Seite ${idx + 1}`} className="h-24 border rounded" />
                                            ))}
                                        </div>
                                    </div>
                                    <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Prüfe Vertrag...
                                            </>
                                        ) : (
                                            'Vertrag prüfen'
                                        )}
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-6">
                            {/* Gesamtbewertung */}
                            <div className={`p-4 rounded-lg ${
                                result.bewertung?.gesamtnote === 'gut' ? 'bg-green-50 border border-green-200' :
                                result.bewertung?.gesamtnote === 'mittel' ? 'bg-orange-50 border border-orange-200' :
                                'bg-red-50 border border-red-200'
                            }`}>
                                <div className="font-semibold mb-2">
                                    GESAMTBEWERTUNG: {result.bewertung?.gesamtnote?.toUpperCase()}
                                </div>
                                <div className="text-sm">{result.bewertung?.kurzfassung}</div>
                            </div>

                            {/* Eckdaten */}
                            <div>
                                <h3 className="font-semibold mb-3">📊 Eckdaten</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-medium">Kaltmiete</div>
                                    <div>{result.zusammenfassung?.kaltmiete} €</div>
                                    <div className="font-medium">Nebenkosten</div>
                                    <div>{result.zusammenfassung?.nebenkosten} €</div>
                                    <div className="font-medium">Kaution</div>
                                    <div>{result.zusammenfassung?.kaution} €</div>
                                    <div className="font-medium">Beginn</div>
                                    <div>{result.zusammenfassung?.mietbeginn}</div>
                                </div>
                            </div>

                            {/* Klauseln */}
                            <div>
                                <h3 className="font-semibold mb-3">📜 Klauseln im Detail</h3>
                                <div className="space-y-4">
                                    {result.klauseln?.map((klausel, idx) => (
                                        <div key={idx} className="border-l-4 pl-4 py-2 space-y-1" style={{
                                            borderColor: klausel.bewertung === 'ok' ? '#10b981' : klausel.bewertung === 'achtung' ? '#f59e0b' : '#ef4444'
                                        }}>
                                            <div className="flex items-center gap-2 font-semibold">
                                                {getBewertungIcon(klausel.bewertung)}
                                                {klausel.thema}
                                            </div>
                                            <div className="text-sm text-slate-600">{klausel.erklaerung}</div>
                                            {klausel.handlungsempfehlung && (
                                                <div className="text-sm font-medium">→ {klausel.handlungsempfehlung}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {usageStats && <AICostDisplay usage={usageStats} />}

                            <Button variant="outline" onClick={() => {
                                setResult(null);
                                setImages([]);
                                setUsageStats(null);
                            }}>
                                Neuen Vertrag prüfen
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}