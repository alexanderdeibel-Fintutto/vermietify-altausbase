import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Upload, Download, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ElsterOverview() {
    const queryClient = useQueryClient();

    const { data: elsterSettings } = useQuery({
        queryKey: ['elsterSettings'],
        queryFn: async () => {
            const user = await base44.auth.me();
            const settings = await base44.entities.ElsterSettings.filter({ user_email: user.email });
            return settings[0] || null;
        }
    });

    const { data: connectionStatus, isLoading: testingConnection } = useQuery({
        queryKey: ['elsterConnection'],
        queryFn: async () => {
            const response = await base44.functions.invoke('testElsterConnection', {});
            return response.data;
        },
        refetchInterval: 60000 // Alle 60 Sekunden
    });

    const { data: certificates = [] } = useQuery({
        queryKey: ['elsterCertificates'],
        queryFn: () => base44.entities.ElsterCertificate.list()
    });

    const { data: submissions = [] } = useQuery({
        queryKey: ['elsterSubmissions'],
        queryFn: async () => {
            const subs = await base44.entities.ElsterSubmission.list();
            return subs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);
        }
    });

    const { data: responses = [] } = useQuery({
        queryKey: ['elsterResponses'],
        queryFn: async () => {
            const resp = await base44.entities.ElsterResponse.list();
            return resp.filter(r => !r.is_read);
        }
    });

    const { data: logs = [] } = useQuery({
        queryKey: ['elsterLogs'],
        queryFn: async () => {
            const allLogs = await base44.entities.ElsterLog.list();
            return allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        }
    });

    const fetchResponsesMutation = useMutation({
        mutationFn: () => base44.functions.invoke('fetchElsterResponses', {}),
        onSuccess: () => {
            queryClient.invalidateQueries(['elsterResponses']);
            queryClient.invalidateQueries(['elsterSubmissions']);
            toast.success('Antworten abgerufen');
        }
    });

    const activeCertificate = certificates.find(c => c.id === elsterSettings?.default_certificate_id);

    const getStatusIcon = (status) => {
        if (status === 'active' || status === 'submitted' || status === 'accepted') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        if (status === 'error' || status === 'rejected' || status === 'expired') return <XCircle className="h-4 w-4 text-red-600" />;
        if (status === 'validating' || status === 'submitting') return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">ELSTER-Übersicht</h1>
                    <p className="text-slate-500 mt-1">Elektronische Übermittlung von Steuererklärungen</p>
                </div>
                <Link to={createPageUrl('ElsterSettings')}>
                    <Button variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Einstellungen
                    </Button>
                </Link>
            </div>

            {/* Status-Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Verbindungsstatus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {testingConnection ? (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Clock className="h-4 w-4 animate-spin" />
                                Prüfe...
                            </div>
                        ) : connectionStatus?.microservice_online ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    ERiC-Service erreichbar
                                </div>
                                {connectionStatus.eric_version && (
                                    <div className="text-xs text-slate-500">Version: {connectionStatus.eric_version}</div>
                                )}
                                <div className={`flex items-center gap-2 ${connectionStatus.elster_reachable ? 'text-green-600' : 'text-red-600'}`}>
                                    {connectionStatus.elster_reachable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    <span className="text-xs">ELSTER {connectionStatus.elster_reachable ? 'erreichbar' : 'nicht erreichbar'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-4 w-4" />
                                Nicht verbunden
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Modus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={elsterSettings?.test_mode ? 'outline' : 'destructive'} className="text-sm">
                            {elsterSettings?.test_mode ? 'Testmodus' : 'PRODUKTIONSMODUS'}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-2">
                            {elsterSettings?.test_mode ? 
                                'Übermittlungen werden nicht ans echte Finanzamt gesendet' : 
                                'Übermittlungen werden ans echte Finanzamt gesendet'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Aktives Zertifikat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeCertificate ? (
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-slate-900">{activeCertificate.holder_name}</div>
                                <div className="text-xs text-slate-500">
                                    Gültig bis: {new Date(activeCertificate.valid_until).toLocaleDateString('de-DE')}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500">Kein Zertifikat ausgewählt</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Schnellaktionen */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Schnellaktionen</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to={createPageUrl('TaxReturns')}>
                        <Button variant="outline" className="w-full gap-2">
                            <Send className="h-4 w-4" />
                            Steuererklärung übermitteln
                        </Button>
                    </Link>
                    <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={() => fetchResponsesMutation.mutate()}
                        disabled={fetchResponsesMutation.isPending}
                    >
                        <Download className="h-4 w-4" />
                        Antworten abrufen
                    </Button>
                    <Link to={createPageUrl('ElsterCertificates')}>
                        <Button variant="outline" className="w-full gap-2">
                            <Upload className="h-4 w-4" />
                            Zertifikat verwalten
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Offene Antworten */}
            {responses.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                        <p className="font-medium mb-1">Sie haben {responses.length} neue Antwort(en) vom Finanzamt</p>
                        <Link to={createPageUrl('ElsterResponses')} className="text-sm text-blue-700 underline">
                            Antworten anzeigen →
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            {/* Letzte Aktivitäten */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Letzte Aktivitäten</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(log.success ? 'active' : 'error')}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-900">
                                        {getActionLabel(log.action)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(log.timestamp).toLocaleString('de-DE')}
                                    </div>
                                    {log.error_message && (
                                        <div className="text-xs text-red-600 mt-1">{log.error_message}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-center text-slate-400 py-8">Keine Aktivitäten</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function getActionLabel(action) {
    const labels = {
        certificate_uploaded: 'Zertifikat hochgeladen',
        certificate_activated: 'Zertifikat aktiviert',
        validation_started: 'Validierung gestartet',
        validation_completed: 'Validierung abgeschlossen',
        submission_started: 'Übermittlung gestartet',
        submission_completed: 'Übermittlung abgeschlossen',
        response_received: 'Antwort empfangen',
        error: 'Fehler aufgetreten'
    };
    return labels[action] || action;
}