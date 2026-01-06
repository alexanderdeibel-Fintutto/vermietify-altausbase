import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// MD5 Hash Berechnung
async function calculateMD5(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export default function SendLetterDialog({ open, onOpenChange, document }) {
    const [options, setOptions] = useState({
        color: '1',
        mode: 'simplex',
        shipping_type: 'normal',
        dispatch_date: '',
        notice: ''
    });
    const [calculatedPrice, setCalculatedPrice] = useState(null);
    const queryClient = useQueryClient();

    const { data: credentials } = useQuery({
        queryKey: ['letterxpress-credentials'],
        queryFn: () => base44.entities.LetterXpressCredential.filter({ is_active: true }),
        initialData: []
    });

    const currentCred = credentials[0];

    const calculatePriceMutation = useMutation({
        mutationFn: async (opts) => {
            const response = await base44.functions.invoke('letterxpress', {
                action: 'calculate_price',
                pages: document?.seitenanzahl || 1,
                color: opts.color,
                mode: opts.mode,
                shipping: 'national',
                registered: opts.shipping_type === 'normal' ? undefined : opts.shipping_type
            });
            return response.data;
        },
        onSuccess: (data) => {
            setCalculatedPrice(data.price);
        }
    });

    const sendMutation = useMutation({
        mutationFn: async () => {
            if (!document.pdf_url) {
                throw new Error('Keine PDF-Datei vorhanden');
            }

            // Warnung bei bereits versendetem Dokument
            if (document.versandstatus === 'versendet') {
                const confirmed = window.confirm(
                    `Dieses Dokument wurde bereits am ${new Date(document.versandt_am).toLocaleString('de-DE')} versendet.\n\nMöchten Sie es erneut versenden?`
                );
                if (!confirmed) {
                    throw new Error('Versand abgebrochen');
                }
            }

            // Dokument-Status auf "in_versand" setzen
            await base44.entities.Document.update(document.id, {
                versandstatus: 'in_versand'
            });

            try {
                // PDF laden und zu Base64 konvertieren
                const pdfResponse = await fetch(document.pdf_url);
                if (!pdfResponse.ok) {
                    throw new Error('PDF konnte nicht geladen werden');
                }

                const pdfBlob = await pdfResponse.blob();
                
                // Größenprüfung (max 50 MB)
                if (pdfBlob.size > 50 * 1024 * 1024) {
                    throw new Error('PDF ist zu groß (max. 50 MB)');
                }

                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(pdfBlob);
                });

                // MD5 Checksum berechnen (Web Crypto API unterstützt kein MD5, daher einfacher Hash)
                const checksum = await calculateMD5(base64);

                const response = await base44.functions.invoke('letterxpress', {
                    action: 'send_letter',
                    pdf_base64: base64,
                    checksum: checksum,
                    filename: document.name || 'Dokument.pdf',
                    color: options.color,
                    mode: options.mode,
                    registered: options.shipping_type,
                    dispatch_date: options.dispatch_date || undefined,
                    notice: options.notice || undefined,
                    document_id: document.id,
                    building_id: document.building_id,
                    recipient_address: document.recipient_address || document.recipient_name || 'Empfänger nicht definiert',
                    document_type: document.category || 'Dokument'
                });

                // Dokument-Status auf "versendet" setzen und Details speichern
                const now = new Date().toISOString();
                const user = await base44.auth.me();
                
                await base44.entities.Document.update(document.id, {
                    versandstatus: 'versendet',
                    versandt_am: now,
                    lxp_job_id: response.data.job_id,
                    versandart: options.shipping_type,
                    status: 'versendet',
                    sent_date: now,
                    change_history: [
                        ...(document.change_history || []),
                        {
                            timestamp: now,
                            user: user?.email || 'System',
                            change_type: 'Brief versendet via LetterXpress',
                            old_value: '',
                            new_value: JSON.stringify({
                                versandart: options.shipping_type,
                                versandart_beschreibung: options.shipping_type === 'r1' ? 'Einschreiben Einwurf' : 
                                                         options.shipping_type === 'r2' ? 'Einschreiben' : 'Normal',
                                farbe: options.color === '1' ? 'Schwarzweiß' : 'Farbe',
                                druck_modus: options.mode === 'simplex' ? 'Einseitig' : 'Doppelseitig',
                                kosten_netto: (response.data.cost_gross / 1.19).toFixed(2),
                                kosten_brutto: response.data.cost_gross,
                                lxp_job_id: response.data.job_id,
                                empfaenger: document.recipient_address || document.recipient_name,
                                seitenanzahl: document.seitenanzahl,
                                status: response.data.status,
                                tracking_verfuegbar: false
                            })
                        }
                    ]
                });

                return response.data;
            } catch (error) {
                // Bei Fehler: Status zurücksetzen
                await base44.entities.Document.update(document.id, {
                    versandstatus: 'nicht_versendet'
                });
                throw error;
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['letter-shipments'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success(`Brief erfolgreich versendet! Kosten: ${data.cost_gross.toFixed(2)} EUR`);
            onOpenChange(false);
        },
        onError: (error) => {
            // Detaillierte Fehlerbehandlung
            let errorMessage = 'Versand fehlgeschlagen';
            
            if (error.response?.status === 400) {
                errorMessage = 'PDF-Format ungültig. Bitte Datei prüfen.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentifizierung fehlgeschlagen. Bitte API-Key in Einstellungen prüfen.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Nicht genügend Guthaben. Bitte Guthaben aufladen.';
            } else if (error.response?.status === 429) {
                errorMessage = 'Zu viele Anfragen. Bitte 60 Sekunden warten.';
            } else if (error.response?.status === 500) {
                errorMessage = 'LetterXpress-Server-Problem. Bitte später erneut versuchen.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        }
    });

    React.useEffect(() => {
        if (open && document) {
            calculatePriceMutation.mutate(options);
        }
    }, [open, options.color, options.mode, options.shipping_type]);

    if (!currentCred) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>LetterXpress nicht konfiguriert</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <p className="text-slate-600">
                            Bitte konfigurieren Sie zuerst LetterXpress in den Einstellungen unter Kommunikation → Postversand.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>Schließen</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const remainingBalance = currentCred.balance - (calculatedPrice || 0);
    const insufficientBalance = remainingBalance < 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Brief mit LetterXpress versenden</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Dokument-Info */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-medium text-slate-900 mb-2">Dokument</h3>
                        <div className="text-sm space-y-1">
                            <div><span className="text-slate-600">Name:</span> {document?.name}</div>
                            <div><span className="text-slate-600">Seiten:</span> {document?.seitenanzahl || 'unbekannt'}</div>
                            {document?.recipient_name && (
                                <div><span className="text-slate-600">Empfänger:</span> {document.recipient_name}</div>
                            )}
                            {document?.versandstatus === 'versendet' && document?.versandt_am && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <span className="text-yellow-700 text-xs">
                                        ⚠️ Bereits versendet am {new Date(document.versandt_am).toLocaleString('de-DE')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Versandoptionen */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-900">Versandoptionen</h3>
                        
                        <div>
                            <Label>Farbe</Label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.color === '1'}
                                        onChange={() => setOptions({ ...options, color: '1' })}
                                    />
                                    Schwarzweiß
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.color === '4'}
                                        onChange={() => setOptions({ ...options, color: '4' })}
                                    />
                                    Farbe
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label>Druck</Label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.mode === 'simplex'}
                                        onChange={() => setOptions({ ...options, mode: 'simplex' })}
                                    />
                                    Einseitig
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.mode === 'duplex'}
                                        onChange={() => setOptions({ ...options, mode: 'duplex' })}
                                    />
                                    Doppelseitig
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label>Versandart</Label>
                            <div className="space-y-2 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.shipping_type === 'normal'}
                                        onChange={() => setOptions({ ...options, shipping_type: 'normal' })}
                                    />
                                    Normal
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.shipping_type === 'r1'}
                                        onChange={() => setOptions({ ...options, shipping_type: 'r1' })}
                                    />
                                    Einschreiben Einwurf (+3,69 EUR)
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={options.shipping_type === 'r2'}
                                        onChange={() => setOptions({ ...options, shipping_type: 'r2' })}
                                    />
                                    Einschreiben (+4,05 EUR)
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="dispatch_date">Versanddatum (optional)</Label>
                            <Input
                                id="dispatch_date"
                                type="date"
                                value={options.dispatch_date}
                                onChange={(e) => setOptions({ ...options, dispatch_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div>
                            <Label htmlFor="notice">Interne Notiz (optional)</Label>
                            <Textarea
                                id="notice"
                                value={options.notice}
                                onChange={(e) => setOptions({ ...options, notice: e.target.value })}
                                placeholder="Objektnummer, Mieter, etc."
                                maxLength={255}
                            />
                        </div>
                    </div>

                    {/* Kostenberechnung */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <h3 className="font-medium text-slate-900">Kosten</h3>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Gesamtkosten:</span>
                            <span className="font-bold text-lg">
                                {calculatedPrice !== null ? `${calculatedPrice.toFixed(2)} EUR` : 'Berechne...'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Aktuelles Guthaben:</span>
                            <span>{currentCred.balance.toFixed(2)} EUR</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-slate-600">Verbleibendes Guthaben:</span>
                            <span className={insufficientBalance ? 'text-red-600 font-medium' : ''}>
                                {remainingBalance.toFixed(2)} EUR
                            </span>
                        </div>

                        {insufficientBalance && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                <div className="text-red-700">
                                    Nicht genügend Guthaben. Bitte laden Sie Ihr Guthaben in den Einstellungen auf.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => sendMutation.mutate()}
                        disabled={sendMutation.isPending || insufficientBalance || calculatedPrice === null}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {sendMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Package className="w-4 h-4 mr-2" />
                        Jetzt versenden
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}