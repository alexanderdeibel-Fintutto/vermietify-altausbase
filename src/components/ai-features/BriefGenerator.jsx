import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function BriefGenerator() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const daten = {
            vermieter_name: formData.get('vermieter_name'),
            vermieter_adresse: formData.get('vermieter_adresse'),
            mieter_name: formData.get('mieter_name'),
            mieter_adresse: formData.get('mieter_adresse'),
            objekt_adresse: formData.get('objekt_adresse'),
            zusatzinfo: formData.get('zusatzinfo'),
            betrag: formData.get('betrag'),
            frist: formData.get('frist')
        };

        setLoading(true);
        try {
            const response = await base44.functions.invoke('callClaudeAPI', {
                featureKey: 'brief',
                systemPrompt: 'Du bist ein Rechtsanwalt für Mietrecht. Erstelle rechtssichere Geschäftsbriefe.',
                userPrompt: `Erstelle einen Brief vom Typ "${formData.get('brieftyp')}" mit diesen Daten: ${JSON.stringify(daten)}. Gib zurück: brief_vollstaendig (formatierter Brief), versandhinweise{empfohlen: "normal"|"einschreiben"|"einschreiben_rueckschein", begruendung}`,
                responseSchema: true
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Brief generiert');
            } else {
                toast.error(response.data.error || 'Fehler beim Generieren');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result.brief_vollstaendig);
        toast.success('Brief in Zwischenablage kopiert');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Brief-Generator
                    </CardTitle>
                    <p className="text-sm text-slate-600">Erstelle rechtssichere Geschäftsbriefe</p>
                </CardHeader>
                <CardContent>
                    {!result && (
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Brieftyp</Label>
                                <Select name="brieftyp" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wähle einen Brieftyp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mahnung">Mahnung / Zahlungserinnerung</SelectItem>
                                        <SelectItem value="mietkuendigung">Mietkündigung</SelectItem>
                                        <SelectItem value="mietanpassung">Mieterhöhung</SelectItem>
                                        <SelectItem value="eigenbedarfskuendigung">Eigenbedarf</SelectItem>
                                        <SelectItem value="maengelanzeige">Mängelanzeige</SelectItem>
                                        <SelectItem value="modernisierungsankuendigung">Modernisierung</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Vermieter Name</Label>
                                    <Input name="vermieter_name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vermieter Adresse</Label>
                                    <Input name="vermieter_adresse" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mieter Name</Label>
                                    <Input name="mieter_name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mieter Adresse</Label>
                                    <Input name="mieter_adresse" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Mietobjekt</Label>
                                <Input name="objekt_adresse" required />
                            </div>

                            <div className="space-y-2">
                                <Label>Zusätzliche Informationen</Label>
                                <Textarea name="zusatzinfo" rows={4} placeholder="z.B. Grund für Kündigung, Details zur Mahnung..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Betrag (falls relevant)</Label>
                                    <Input name="betrag" type="number" step="0.01" placeholder="z.B. 1234.56" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Frist (falls relevant)</Label>
                                    <Input name="frist" placeholder="z.B. 14 Tage" />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generiere Brief...</> : 'Brief erstellen'}
                            </Button>
                        </form>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className="p-6 bg-white border rounded-lg shadow-sm">
                                <div className="whitespace-pre-wrap font-mono text-sm">{result.brief_vollstaendig}</div>
                            </div>

                            {result.versandhinweise && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="font-semibold mb-1">📮 Versandempfehlung</div>
                                    <div className="text-sm">
                                        {result.versandhinweise.empfohlen === 'einschreiben_rueckschein' ? 'Einschreiben mit Rückschein' : 
                                         result.versandhinweise.empfohlen === 'einschreiben' ? 'Einschreiben' : 'Normaler Versand'}
                                    </div>
                                    <div className="text-sm text-slate-600">{result.versandhinweise.begruendung}</div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Kopieren
                                </Button>
                                <Button variant="outline" onClick={() => setResult(null)}>
                                    Neuer Brief
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}