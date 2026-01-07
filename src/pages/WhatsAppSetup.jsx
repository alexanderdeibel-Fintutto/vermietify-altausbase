import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WHATSAPP_CONFIG } from '../components/whatsapp/whatsapp-config';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';

export default function WhatsAppSetup() {
    const [step, setStep] = useState(1);
    const [selectedAnbieter, setSelectedAnbieter] = useState('trengo');
    const [formData, setFormData] = useState({
        telefonnummer: '',
        display_name: '',
        api_key: '',
        account_id: ''
    });
    const [tested, setTested] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const setupMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('whatsapp_setupAccount', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
            setTested(true);
            toast.success('WhatsApp-Account erfolgreich eingerichtet!');
        },
        onError: (error) => {
            toast.error(error.message || 'Fehler beim Einrichten');
        }
    });

    const handleTest = () => {
        setupMutation.mutate({
            anbieter: selectedAnbieter,
            ...formData
        });
    };

    const handleComplete = () => {
        navigate(createPageUrl('WhatsAppCommunication'));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">WhatsApp einrichten</h1>
                <p className="text-slate-600 mt-2">Richten Sie WhatsApp Business für Ihre Verwaltung ein</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                        <div className={`w-full h-2 rounded ${s <= step ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    </div>
                ))}
            </div>

            {/* Step 1: Anbieter wählen */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schritt 1: Anbieter wählen</CardTitle>
                        <CardDescription>Wählen Sie einen WhatsApp Business Service Provider</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup value={selectedAnbieter} onValueChange={setSelectedAnbieter}>
                            {WHATSAPP_CONFIG.ANBIETER.map((anbieter) => (
                                <Card key={anbieter.id} className="cursor-pointer hover:border-emerald-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value={anbieter.id} id={anbieter.id} />
                                            <Label htmlFor={anbieter.id} className="flex-1 cursor-pointer">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{anbieter.name}</p>
                                                        <p className="text-sm text-slate-600">{anbieter.beschreibung}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <Badge variant="outline">{anbieter.land}</Badge>
                                                            <Badge variant="outline">€{anbieter.kosten_monat}/Monat</Badge>
                                                            {anbieter.dsgvo_konform && <Badge className="bg-green-100 text-green-800">DSGVO</Badge>}
                                                            {anbieter.empfohlen && <Badge className="bg-blue-100 text-blue-800">Empfohlen</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </RadioGroup>

                        <Button onClick={() => setStep(2)} className="w-full">
                            Weiter mit {WHATSAPP_CONFIG.ANBIETER.find(a => a.id === selectedAnbieter)?.name}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Anleitung */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schritt 2: Account erstellen bei {WHATSAPP_CONFIG.ANBIETER.find(a => a.id === selectedAnbieter)?.name}</CardTitle>
                        <CardDescription>Folgen Sie der Anleitung zum Einrichten</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                            <p className="font-medium text-blue-900">So richten Sie Ihren Account ein:</p>
                            <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                <li>Erstellen Sie einen Account beim Anbieter</li>
                                <li>Verifizieren Sie Ihre WhatsApp Business Nummer</li>
                                <li>Notieren Sie Ihre API-Zugangsdaten</li>
                            </ol>
                        </div>

                        <Button variant="outline" className="w-full" asChild>
                            <a href={`https://${selectedAnbieter}.com`} target="_blank" rel="noopener noreferrer">
                                Zur Anbieter-Website
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                Zurück
                            </Button>
                            <Button onClick={() => setStep(3)} className="flex-1">
                                Weiter
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: API-Zugangsdaten */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schritt 3: API-Zugangsdaten eingeben</CardTitle>
                        <CardDescription>Verbinden Sie Ihren WhatsApp Business Account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>WhatsApp Business Nummer</Label>
                            <Input
                                type="tel"
                                placeholder="+491511234567"
                                value={formData.telefonnummer}
                                onChange={(e) => setFormData({ ...formData, telefonnummer: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Anzeigename (wird im Chat angezeigt)</Label>
                            <Input
                                placeholder="Hausverwaltung Müller"
                                value={formData.display_name}
                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder="sk_xxxxx"
                                value={formData.api_key}
                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Account ID</Label>
                            <Input
                                placeholder="acc_xxxxx"
                                value={formData.account_id}
                                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                            />
                        </div>

                        {tested && (
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-green-900 font-medium">Verbindung erfolgreich getestet!</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                                Zurück
                            </Button>
                            <Button 
                                onClick={handleTest} 
                                disabled={setupMutation.isPending}
                                className="flex-1"
                            >
                                {setupMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Teste...
                                    </>
                                ) : (
                                    'Verbindung testen'
                                )}
                            </Button>
                            {tested && (
                                <Button onClick={() => setStep(4)} className="flex-1">
                                    Weiter
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Einwilligung */}
            {step === 4 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Schritt 4: Einwilligungen einholen</CardTitle>
                        <CardDescription>DSGVO-konforme Einwilligung Ihrer Kontakte</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-900">Wichtig: Einwilligung erforderlich</p>
                                <p className="text-amber-800 text-sm mt-1">
                                    Sie benötigen die ausdrückliche Einwilligung Ihrer Mieter/Eigentümer, 
                                    bevor Sie ihnen WhatsApp-Nachrichten senden dürfen.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="font-medium text-slate-900">Empfohlene Vorgehensweise:</p>
                            <ol className="list-decimal list-inside space-y-2 text-slate-600">
                                <li>Kontakte synchronisieren (Mieter & Eigentümer)</li>
                                <li>Automatisch Einwilligungs-E-Mails versenden</li>
                                <li>Kontakte bestätigen über persönlichen Link</li>
                            </ol>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                                Zurück
                            </Button>
                            <Button onClick={handleComplete} className="flex-1">
                                Einrichtung abschließen
                                <CheckCircle className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}