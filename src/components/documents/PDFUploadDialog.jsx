import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PDFUploadDialog({ open, onOpenChange }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Sonstiges',
        status: 'erstellt',
        building_id: '',
        tenant_id: '',
        recipient_name: '',
        recipient_address: ''
    });
    const queryClient = useQueryClient();

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list(),
        enabled: open
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list(),
        enabled: open
    });

    const uploadMutation = useMutation({
        mutationFn: async (data) => {
            // PDF hochladen
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            // PDF-Metadaten extrahieren
            let pages = 1;
            try {
                const metadataResponse = await base44.functions.invoke('extractPDFMetadata', {
                    pdf_url: file_url
                });
                pages = metadataResponse.data?.metadata?.pages || 1;
            } catch (error) {
                console.error('Metadata extraction failed:', error);
            }

            // Dokument erstellen
            return base44.entities.Document.create({
                ...data,
                pdf_url: file_url,
                seitenanzahl: pages,
                versandstatus: 'nicht_versendet'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('Dokument erfolgreich hochgeladen');
            handleClose();
        },
        onError: (error) => {
            toast.error('Fehler beim Upload: ' + error.message);
        }
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            if (!formData.name) {
                setFormData({ ...formData, name: selectedFile.name.replace('.pdf', '') });
            }
        } else {
            toast.error('Bitte eine PDF-Datei auswählen');
        }
    };

    const handleTenantChange = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        const building = buildings.find(b => b.id === formData.building_id);
        
        if (tenant) {
            const recipientName = `${tenant.first_name} ${tenant.last_name}`;
            const recipientAddress = building 
                ? `${recipientName}\n${building.address}\n${building.postal_code} ${building.city}`
                : recipientName;
            
            setFormData({
                ...formData,
                tenant_id: tenantId,
                recipient_name: recipientName,
                recipient_address: recipientAddress
            });
        }
    };

    const handleBuildingChange = (buildingId) => {
        const building = buildings.find(b => b.id === buildingId);
        const tenant = tenants.find(t => t.id === formData.tenant_id);
        
        if (building && tenant) {
            const recipientName = `${tenant.first_name} ${tenant.last_name}`;
            const recipientAddress = `${recipientName}\n${building.address}\n${building.postal_code} ${building.city}`;
            
            setFormData({
                ...formData,
                building_id: buildingId,
                recipient_address: recipientAddress
            });
        } else {
            setFormData({ ...formData, building_id: buildingId });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Bitte eine Datei auswählen');
            return;
        }
        if (!formData.name) {
            toast.error('Bitte einen Namen eingeben');
            return;
        }
        uploadMutation.mutate(formData);
    };

    const handleClose = () => {
        setFile(null);
        setFormData({
            name: '',
            category: 'Sonstiges',
            status: 'erstellt',
            building_id: '',
            tenant_id: '',
            recipient_name: '',
            recipient_address: ''
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>PDF hochladen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="pdf-file">PDF-Datei</Label>
                        <Input
                            id="pdf-file"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                        />
                        {file && (
                            <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {file.name} ({(file.size / 1024).toFixed(0)} KB)
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="name">Dokumentenname</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="z.B. Nebenkostenabrechnung 2024"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Kategorie</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mietrecht">Mietrecht</SelectItem>
                                    <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                                    <SelectItem value="Finanzen">Finanzen</SelectItem>
                                    <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="zu_erledigen">Zu erledigen</SelectItem>
                                    <SelectItem value="erstellt">Erstellt</SelectItem>
                                    <SelectItem value="versendet">Versendet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Gebäude (optional)</Label>
                            <Select
                                value={formData.building_id}
                                onValueChange={handleBuildingChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {buildings.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Mieter (optional)</Label>
                            <Select
                                value={formData.tenant_id}
                                onValueChange={handleTenantChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tenants.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.first_name} {t.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.recipient_address && (
                        <div>
                            <Label>Empfängeradresse</Label>
                            <Textarea
                                value={formData.recipient_address}
                                onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
                                rows={3}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Abbrechen
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={uploadMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Hochladen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}