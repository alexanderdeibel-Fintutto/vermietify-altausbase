import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AutoSubmitScheduler from '@/components/elster/AutoSubmitScheduler';

export default function ElsterSettings() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['elsterSettings'],
        queryFn: async () => {
            const user = await base44.auth.me();
            const s = await base44.entities.ElsterSettings.filter({ user_email: user.email });
            return s[0] || null;
        }
    });

    const { data: certificates = [] } = useQuery({
        queryKey: ['elsterCertificates'],
        queryFn: () => base44.entities.ElsterCertificate.list()
    });

    const { data: connectionStatus, refetch: testConnection, isFetching: testing } = useQuery({
        queryKey: ['elsterConnection'],
        queryFn: async () => {
            const response = await base44.functions.invoke('testElsterConnection', {});
            return response.data;
        },
        enabled: false
    });

    const [formData, setFormData] = useState({
        eric_service_url: '',
        default_certificate_id: '',
        test_mode: true,
        auto_fetch_responses: true,
        notification_email: '',
        tax_office_number: '',
        tax_number: ''
    });

    React.useEffect(() => {
        if (settings) setFormData(settings);
    }, [settings]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const user = await base44.auth.me();
            if (settings) {
                return base44.entities.ElsterSettings.update(settings.id, data);
            }
            return base44.entities.ElsterSettings.create({ ...data, user_email: user.email });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['elsterSettings']);
            toast.success('Einstellungen gespeichert');
        }
    });

    if (isLoading) return <div className="p-6">Laden...</div>;

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-light text-slate-900">ELSTER-Einstellungen</h1>
                <p className="text-slate-500 mt-1">Konfiguration der ELSTER-Integration</p>
            </div>

            {/* Microservice-Konfiguration */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">ERiC-Microservice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-600 mb-2 block">Service-URL</label>
                        <Input 
                            placeholder="https://your-eric-service.example.com"
                            value={formData.eric_service_url}
                            onChange={(e) => setFormData({...formData, eric_service_url: e.target.value})}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            URL zum ERiC-Microservice (siehe Dokumentation)
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline"
                            onClick={() => testConnection()}
                            disabled={testing}
                            className="gap-2"
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Teste...
                                </>
                            ) : (
                                'Verbindung testen'
                            )}
                        </Button>

                        {connectionStatus && (
                            <div className="flex items-center gap-2">
                                {connectionStatus.microservice_online ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-600">Verbunden</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-sm text-red-600">Nicht erreichbar</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {connectionStatus?.eric_version && (
                        <div className="text-xs text-slate-500">
                            ERiC-Version: {connectionStatus.eric_version}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Testmodus */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Testmodus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">Testmodus aktivieren</p>
                            <p className="text-sm text-slate-500">
                                Im Testmodus werden Übermittlungen nicht ans echte Finanzamt gesendet
                            </p>
                        </div>
                        <Switch 
                            checked={formData.test_mode}
                            onCheckedChange={(checked) => setFormData({...formData, test_mode: checked})}
                        />
                    </div>

                    {!formData.test_mode && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-900">
                                <strong>ACHTUNG:</strong> Produktionsmodus ist aktiv! 
                                Übermittlungen werden an das echte Finanzamt gesendet.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Standard-Zertifikat */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Standard-Zertifikat</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select 
                        value={formData.default_certificate_id || ''} 
                        onValueChange={(v) => setFormData({...formData, default_certificate_id: v})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Kein Zertifikat ausgewählt" />
                        </SelectTrigger>
                        <SelectContent>
                            {certificates.map(cert => (
                                <SelectItem key={cert.id} value={cert.id}>
                                    {cert.holder_name} - {cert.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Automatisierung */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Automatisierung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">Antworten automatisch abrufen</p>
                            <p className="text-sm text-slate-500">
                                Prüft täglich auf neue Antworten vom Finanzamt
                            </p>
                        </div>
                        <Switch 
                            checked={formData.auto_fetch_responses}
                            onCheckedChange={(checked) => setFormData({...formData, auto_fetch_responses: checked})}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-600 mb-2 block">Benachrichtigungs-E-Mail</label>
                        <Input 
                            type="email"
                            placeholder="ihre@email.de"
                            value={formData.notification_email}
                            onChange={(e) => setFormData({...formData, notification_email: e.target.value})}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Steuerdaten */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Steuerdaten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-600 mb-2 block">Finanzamtsnummer</label>
                        <Input 
                            placeholder="z.B. 1010"
                            value={formData.tax_office_number}
                            onChange={(e) => setFormData({...formData, tax_office_number: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-600 mb-2 block">Steuernummer</label>
                        <Input 
                            placeholder="z.B. 12/345/67890"
                            value={formData.tax_number}
                            onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Automatische Übermittlung */}
            <AutoSubmitScheduler />

            <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
                className="w-full"
            >
                Einstellungen speichern
            </Button>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}