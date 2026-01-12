import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, XCircle, Info, AlertTriangle, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function ElsterCertificates() {
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState(null);
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [uploading, setUploading] = useState(false);

    const { data: certificates = [] } = useQuery({
        queryKey: ['elsterCertificates'],
        queryFn: () => base44.entities.ElsterCertificate.list()
    });

    const { data: settings } = useQuery({
        queryKey: ['elsterSettings'],
        queryFn: async () => {
            const user = await base44.auth.me();
            const s = await base44.entities.ElsterSettings.filter({ user_email: user.email });
            return s[0] || null;
        }
    });

    const setDefaultMutation = useMutation({
        mutationFn: (certificateId) => {
            return base44.entities.ElsterSettings.update(settings.id, {
                default_certificate_id: certificateId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['elsterSettings']);
            toast.success('Standard-Zertifikat gesetzt');
        }
    });

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!selectedFile || !pin || !name) {
            toast.error('Bitte alle Felder ausfüllen');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('certificate_file', selectedFile);
            formData.append('pin', pin);
            formData.append('name', name);

            const response = await fetch('/api/functions/uploadElsterCertificate', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${await base44.auth.getToken()}`
                }
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Zertifikat erfolgreich hochgeladen');
                queryClient.invalidateQueries(['elsterCertificates']);
                setSelectedFile(null);
                setPin('');
                setName('');
            } else {
                toast.error(result.error || 'Upload fehlgeschlagen');
            }
        } catch (error) {
            toast.error('Fehler beim Upload');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (cert) => {
        const validUntil = new Date(cert.valid_until);
        const now = new Date();
        const daysUntilExpiry = Math.floor((validUntil - now) / (1000 * 60 * 60 * 24));

        if (cert.status === 'expired' || daysUntilExpiry < 0) {
            return <Badge variant="destructive">Abgelaufen</Badge>;
        }
        if (daysUntilExpiry < 30) {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Läuft bald ab</Badge>;
        }
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktiv</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-light text-slate-900">ELSTER-Zertifikate</h1>
                <p className="text-slate-500 mt-1">Verwalten Sie Ihre Authentifizierungs-Zertifikate</p>
            </div>

            {/* Info-Box */}
            <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                    <p className="font-medium mb-2">So erhalten Sie ein ELSTER-Zertifikat</p>
                    <p className="text-sm text-blue-700">
                        1. Registrieren Sie sich auf <a href="https://www.elster.de" target="_blank" rel="noopener noreferrer" className="underline">elster.de</a><br />
                        2. Beantragen Sie ein Zertifikat (kostenlos)<br />
                        3. Laden Sie die .pfx oder .p12 Datei herunter<br />
                        4. Laden Sie das Zertifikat hier hoch
                    </p>
                </AlertDescription>
            </Alert>

            {/* Upload-Bereich */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Neues Zertifikat hochladen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Bezeichnung</label>
                            <Input 
                                placeholder="z.B. Mein Zertifikat 2024"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Zertifikatsdatei (.pfx oder .p12)</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                                <input 
                                    type="file"
                                    accept=".pfx,.p12"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="hidden"
                                    id="cert-upload"
                                />
                                <label htmlFor="cert-upload" className="cursor-pointer">
                                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">
                                        {selectedFile ? selectedFile.name : 'Datei auswählen oder hier ablegen'}
                                    </p>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">PIN (wird nicht gespeichert!)</label>
                            <Input 
                                type="password"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                autoComplete="off"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Die PIN wird nur zur Validierung verwendet und nicht gespeichert.
                            </p>
                        </div>

                        <Button type="submit" disabled={uploading || !selectedFile || !pin || !name} className="w-full">
                            {uploading ? 'Hochladen...' : 'Zertifikat hochladen und validieren'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Zertifikats-Liste */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium text-slate-900">Meine Zertifikate</h2>
                
                {certificates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-slate-400">
                            Noch keine Zertifikate hochgeladen
                        </CardContent>
                    </Card>
                ) : (
                    certificates.map(cert => (
                        <Card key={cert.id} className="border-2 hover:border-slate-300 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-medium text-slate-900">{cert.name}</h3>
                                            {getStatusBadge(cert)}
                                            {settings?.default_certificate_id === cert.id && (
                                                <Badge variant="outline" className="gap-1">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    Standard
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1 text-sm">
                                            <div className="flex gap-2">
                                                <span className="text-slate-600">Inhaber:</span>
                                                <span className="font-medium">{cert.holder_name}</span>
                                            </div>
                                            {cert.holder_tax_id && (
                                                <div className="flex gap-2">
                                                    <span className="text-slate-600">Steuer-ID:</span>
                                                    <span className="font-medium">{cert.holder_tax_id}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <span className="text-slate-600">Gültig:</span>
                                                <span className="font-medium">
                                                    {new Date(cert.valid_from).toLocaleDateString('de-DE')} - {new Date(cert.valid_until).toLocaleDateString('de-DE')}
                                                </span>
                                            </div>
                                            {cert.last_used && (
                                                <div className="flex gap-2">
                                                    <span className="text-slate-600">Zuletzt verwendet:</span>
                                                    <span className="font-medium">{new Date(cert.last_used).toLocaleString('de-DE')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {settings?.default_certificate_id !== cert.id && cert.status === 'active' && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setDefaultMutation.mutate(cert.id)}
                                        >
                                            Als Standard setzen
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}