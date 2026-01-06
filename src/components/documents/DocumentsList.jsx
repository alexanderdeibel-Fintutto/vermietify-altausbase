import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye, Edit, Trash2, Download, Send, CheckCircle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DocumentCreateWizard from './DocumentCreateWizard';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import SendLetterDialog from '../letterxpress/SendLetterDialog';

const STATUS_CONFIG = {
    zu_erledigen: { label: 'Zu erledigen', color: 'bg-slate-100 text-slate-700', icon: FileText },
    erinnern: { label: 'Erinnern', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
    erstellt: { label: 'Erstellt', color: 'bg-blue-100 text-blue-700', icon: FileText },
    geaendert: { label: 'Geändert', color: 'bg-purple-100 text-purple-700', icon: Edit },
    versendet: { label: 'Versendet', color: 'bg-indigo-100 text-indigo-700', icon: Send },
    unterschrieben: { label: 'Unterschrieben', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    gescannt: { label: 'Gescannt', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
};

export default function DocumentsList() {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [sendLetterDocument, setSendLetterDocument] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: tenants = [] } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => base44.entities.Tenant.list()
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.Document.update(id, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Document.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
    });

    const filteredDocuments = filterStatus === 'all' 
        ? documents 
        : documents.filter(d => d.status === filterStatus);

    const getBuildingName = (id) => buildings.find(b => b.id === id)?.name || 'Unbekannt';
    const getTenantName = (id) => {
        const tenant = tenants.find(t => t.id === id);
        return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt';
    };

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Lädt...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                    >
                        Alle ({documents.length})
                    </Button>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const count = documents.filter(d => d.status === key).length;
                        return (
                            <Button
                                key={key}
                                variant={filterStatus === key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterStatus(key)}
                            >
                                {config.label} ({count})
                            </Button>
                        );
                    })}
                </div>
                <Button onClick={() => setWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Dokument
                </Button>
            </div>

            <div className="grid gap-4">
                {filteredDocuments.length === 0 ? (
                    <Card className="p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Dokumente</h3>
                        <p className="text-slate-600 mb-6">Erstellen Sie Ihr erstes Dokument</p>
                        <Button onClick={() => setWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Dokument erstellen
                        </Button>
                    </Card>
                ) : (
                    filteredDocuments.map((doc) => {
                        const statusConfig = STATUS_CONFIG[doc.status];
                        const StatusIcon = statusConfig?.icon || FileText;

                        return (
                            <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <StatusIcon className="w-5 h-5 text-emerald-600" />
                                            <h3 className="font-semibold text-slate-800">{doc.name}</h3>
                                            <Badge className={statusConfig?.color}>
                                                {statusConfig?.label}
                                            </Badge>
                                            {doc.category && (
                                                <Badge variant="outline">{doc.category}</Badge>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                                           {doc.building_id && (
                                               <div>
                                                   <p className="text-slate-500">Gebäude</p>
                                                   <p className="font-medium text-slate-800">{getBuildingName(doc.building_id)}</p>
                                               </div>
                                           )}
                                           {doc.tenant_id && (
                                               <div>
                                                   <p className="text-slate-500">Mieter</p>
                                                   <p className="font-medium text-slate-800">{getTenantName(doc.tenant_id)}</p>
                                               </div>
                                           )}
                                           <div>
                                               <p className="text-slate-500">Erstellt</p>
                                               <p className="font-medium text-slate-800">
                                                   {format(new Date(doc.created_date), 'dd.MM.yyyy', { locale: de })}
                                               </p>
                                           </div>
                                           {doc.versandstatus === 'versendet' && doc.versandt_am && (
                                               <div>
                                                   <p className="text-slate-500">Versendet</p>
                                                   <p className="font-medium text-emerald-600">
                                                       {format(new Date(doc.versandt_am), 'dd.MM.yyyy HH:mm', { locale: de })}
                                                   </p>
                                                   {doc.versandart && (
                                                       <p className="text-xs text-slate-500">
                                                           {doc.versandart === 'r1' ? 'Einschreiben Einwurf' : 
                                                            doc.versandart === 'r2' ? 'Einschreiben' : 'Normal'}
                                                       </p>
                                                   )}
                                               </div>
                                           )}
                                           {doc.reminder_date && !doc.versandt_am && (
                                               <div>
                                                   <p className="text-slate-500">Erinnerung</p>
                                                   <p className="font-medium text-slate-800">
                                                       {format(new Date(doc.reminder_date), 'dd.MM.yyyy', { locale: de })}
                                                   </p>
                                               </div>
                                           )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewDocument(doc)}
                                            title="Vorschau"
                                        >
                                            <Eye className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        {doc.pdf_url && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => window.open(doc.pdf_url, '_blank')}
                                                    title="PDF herunterladen"
                                                >
                                                    <Download className="w-4 h-4 text-slate-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSendLetterDocument(doc)}
                                                    title="Per Post versenden"
                                                >
                                                    <Mail className="w-4 h-4 text-emerald-600" />
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm('Dokument wirklich löschen?')) {
                                                    deleteMutation.mutate(doc.id);
                                                }
                                            }}
                                            title="Löschen"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <DocumentCreateWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
            />

            {previewDocument && (
                <DocumentPreviewDialog
                    document={previewDocument}
                    open={!!previewDocument}
                    onOpenChange={(open) => !open && setPreviewDocument(null)}
                    onStatusChange={(status) => {
                        updateStatusMutation.mutate({ id: previewDocument.id, status });
                        setPreviewDocument(null);
                    }}
                />
            )}

            {sendLetterDocument && (
                <SendLetterDialog
                    open={!!sendLetterDocument}
                    onOpenChange={(open) => !open && setSendLetterDocument(null)}
                    document={sendLetterDocument}
                />
            )}
        </div>
    );
}