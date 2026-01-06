import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function LetterXpressSettings() {
    const [formData, setFormData] = useState({
        username: '',
        api_key: '',
        mode: 'test'
    });
    const queryClient = useQueryClient();

    const { data: credentials, isLoading } = useQuery({
        queryKey: ['letterxpress-credentials'],
        queryFn: () => base44.entities.LetterXpressCredential.filter({ is_active: true }),
        initialData: []
    });

    const currentCred = credentials[0];

    React.useEffect(() => {
        if (currentCred) {
            setFormData({
                username: currentCred.username,
                api_key: '••••••••••••',
                mode: currentCred.mode
            });
        }
    }, [currentCred]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (currentCred) {
                return base44.entities.LetterXpressCredential.update(currentCred.id, data);
            } else {
                return base44.entities.LetterXpressCredential.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['letterxpress-credentials'] });
            toast.success('Einstellungen gespeichert');
        },
        onError: (error) => {
            toast.error('Fehler beim Speichern: ' + error.message);
        }
    });

    const checkBalanceMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('letterxpress', {
                action: 'check_balance'
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['letterxpress-credentials'] });
            toast.success(`Guthaben aktualisiert: ${data.balance.toFixed(2)} EUR`);
        },
        onError: (error) => {
            toast.error('Fehler beim Abrufen: ' + error.message);
        }
    });

    const handleSave = () => {
        const dataToSave = {
            username: formData.username,
            mode: formData.mode,
            is_active: true
        };

        if (formData.api_key !== '••••••••••••') {
            dataToSave.api_key = formData.api_key;
        }

        saveMutation.mutate(dataToSave);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>LetterXpress Account</CardTitle>
                    <CardDescription>
                        Verbinden Sie Ihren LetterXpress-Account für automatischen Briefversand
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                        <p className="font-medium text-blue-900 mb-2">Hinweis:</p>
                        <p className="text-blue-700">
                            Account muss auf{' '}
                            <a 
                                href="https://letterxpress.de/registrieren/geschaeftskunde" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline inline-flex items-center gap-1"
                            >
                                letterxpress.de
                                <ExternalLink className="w-3 h-3" />
                            </a>
                            {' '}erstellt werden. Nach Registrierung kann der API-Key im Kundenbereich generiert werden:
                            Funktionen → Zugangsdaten → LXP API
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="username">Benutzername (E-Mail)</Label>
                        <Input
                            id="username"
                            type="email"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="ihre-email@beispiel.de"
                        />
                    </div>

                    <div>
                        <Label htmlFor="api_key">API-Key</Label>
                        <Input
                            id="api_key"
                            type="password"
                            value={formData.api_key}
                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            placeholder="Ihr API-Key"
                        />
                    </div>

                    <div>
                        <Label>Modus</Label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.mode === 'test'}
                                    onChange={() => setFormData({ ...formData, mode: 'test' })}
                                />
                                <span>Test (Briefe werden nicht versendet)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.mode === 'live'}
                                    onChange={() => setFormData({ ...formData, mode: 'live' })}
                                />
                                <span>Live</span>
                            </label>
                        </div>
                    </div>

                    {currentCred && (
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Aktuelles Guthaben</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {currentCred.balance?.toFixed(2) || '0.00'} EUR
                                    </p>
                                    {currentCred.last_balance_check && (
                                        <p className="text-xs text-slate-500">
                                            Zuletzt geprüft: {new Date(currentCred.last_balance_check).toLocaleString('de-DE')}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => checkBalanceMutation.mutate()}
                                    disabled={checkBalanceMutation.isPending}
                                >
                                    {checkBalanceMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            <Button
                                variant="link"
                                className="mt-2 p-0 h-auto"
                                onClick={() => window.open('https://letterxpress.de/guthaben-aufladen', '_blank')}
                            >
                                Guthaben aufladen <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saveMutation.isPending || !formData.username}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}