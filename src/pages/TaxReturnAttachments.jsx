import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Download, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxReturnAttachments() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const taxReturnId = urlParams.get('tax_return_id');

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [formType, setFormType] = useState('anlage_kap');
    const [attachmentType, setAttachmentType] = useState('steuerbescheinigung');
    const [description, setDescription] = useState('');
    const [issuer, setIssuer] = useState('');

    const { data: attachments = [] } = useQuery({
        queryKey: ['attachments', taxReturnId],
        queryFn: () => base44.entities.TaxFormAttachment.filter({ tax_return_id: taxReturnId }),
        enabled: !!taxReturnId
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            const { data } = await base44.integrations.Core.UploadFile({ file: selectedFile });
            
            return base44.entities.TaxFormAttachment.create({
                tax_return_id: taxReturnId,
                form_type: formType,
                attachment_type: attachmentType,
                description,
                issuer,
                file_url: data.file_url,
                file_name: selectedFile.name,
                is_required: false,
                document_date: new Date().toISOString().split('T')[0]
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['attachments']);
            setUploadDialogOpen(false);
            setSelectedFile(null);
            setDescription('');
            setIssuer('');
            toast.success('Beleg hochgeladen');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.TaxFormAttachment.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['attachments']);
            toast.success('Beleg gelöscht');
        }
    });

    const requiredDocs = [
        { form: 'anlage_kap', type: 'steuerbescheinigung', label: 'Jahressteuerbescheinigung Bank/Broker', required: true },
        { form: 'anlage_kap', type: 'jahresbescheinigung', label: 'Erträgnisaufstellung', required: false },
        { form: 'anlage_kap', type: 'quellensteuerbescheinigung', label: 'Quellensteuerbescheinigungen (ausländische Dividenden)', required: false },
        { form: 'anlage_so', type: 'beleg', label: 'Transaktionsnachweise Krypto/Edelmetalle', required: false },
        { form: 'anlage_vorsorge', type: 'beleg', label: 'Versicherungsbescheinigungen', required: false }
    ];

    const hasDocument = (form, type) => {
        return attachments.some(a => a.form_type === form && a.attachment_type === type);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Belege & Anhänge</h1>
                    <p className="text-slate-500 mt-1">Erforderliche Nachweise für Ihre Steuererklärung</p>
                </div>
                <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Beleg hochladen
                </Button>
            </div>

            {/* Checkliste */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Checkliste benötigter Dokumente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {requiredDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                hasDocument(doc.form, doc.type) ? 'bg-green-500 border-green-500' : 'border-slate-300'
                            }`}>
                                {hasDocument(doc.form, doc.type) && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                                {doc.required && (
                                    <Badge variant="outline" className="text-xs mt-1">Pflicht</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Hochgeladene Dokumente */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">
                        Hochgeladene Dokumente ({attachments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {attachments.length > 0 ? (
                        <div className="space-y-3">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50">
                                    <FileText className="h-8 w-8 text-slate-400" />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{att.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {getFormLabel(att.form_type)}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {getAttachmentTypeLabel(att.attachment_type)}
                                            </Badge>
                                            {att.issuer && (
                                                <span className="text-xs text-slate-500">{att.issuer}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        <a href={att.file_url} download={att.file_name}>
                                            <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(att.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            Noch keine Belege hochgeladen
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Beleg hochladen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Formular</label>
                            <Select value={formType} onValueChange={setFormType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="anlage_kap">Anlage KAP</SelectItem>
                                    <SelectItem value="anlage_so">Anlage SO</SelectItem>
                                    <SelectItem value="anlage_v">Anlage V</SelectItem>
                                    <SelectItem value="anlage_vorsorge">Anlage Vorsorge</SelectItem>
                                    <SelectItem value="mantelbogen">Mantelbogen</SelectItem>
                                    <SelectItem value="other">Sonstiges</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Art des Belegs</label>
                            <Select value={attachmentType} onValueChange={setAttachmentType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="steuerbescheinigung">Steuerbescheinigung</SelectItem>
                                    <SelectItem value="jahresbescheinigung">Jahresbescheinigung</SelectItem>
                                    <SelectItem value="quellensteuerbescheinigung">Quellensteuerbescheinigung</SelectItem>
                                    <SelectItem value="beleg">Beleg/Rechnung</SelectItem>
                                    <SelectItem value="nachweis">Nachweis</SelectItem>
                                    <SelectItem value="other">Sonstiges</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Beschreibung</label>
                            <Input 
                                placeholder="z.B. Jahressteuerbescheinigung Trade Republic 2024"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Aussteller (optional)</label>
                            <Input 
                                placeholder="z.B. Trade Republic"
                                value={issuer}
                                onChange={(e) => setIssuer(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">Datei</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                                <input 
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="hidden"
                                    id="attachment-upload"
                                />
                                <label htmlFor="attachment-upload" className="cursor-pointer">
                                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">
                                        {selectedFile ? selectedFile.name : 'Datei auswählen'}
                                    </p>
                                </label>
                            </div>
                        </div>

                        <Button 
                            onClick={() => uploadMutation.mutate()}
                            disabled={!selectedFile || !description || uploadMutation.isPending}
                            className="w-full"
                        >
                            Hochladen
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function getFormLabel(formType) {
    const labels = {
        'anlage_kap': 'KAP',
        'anlage_so': 'SO',
        'anlage_v': 'V',
        'anlage_vorsorge': 'Vorsorge',
        'mantelbogen': 'Mantelbogen',
        'other': 'Sonstiges'
    };
    return labels[formType] || formType;
}

function getAttachmentTypeLabel(type) {
    const labels = {
        'steuerbescheinigung': 'Steuerbescheinigung',
        'jahresbescheinigung': 'Jahresbescheinigung',
        'quellensteuerbescheinigung': 'Quellensteuer',
        'beleg': 'Beleg',
        'nachweis': 'Nachweis',
        'other': 'Sonstiges'
    };
    return labels[type] || type;
}