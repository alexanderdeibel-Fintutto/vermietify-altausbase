import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Send, CheckCircle, Edit } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'zu_erledigen', label: 'Zu erledigen' },
    { value: 'erinnern', label: 'Erinnern' },
    { value: 'erstellt', label: 'Erstellt' },
    { value: 'geaendert', label: 'Geändert' },
    { value: 'versendet', label: 'Versendet' },
    { value: 'unterschrieben', label: 'Unterschrieben' },
    { value: 'gescannt', label: 'Gescannt' }
];

export default function DocumentPreviewDialog({ document, open, onOpenChange, onStatusChange }) {
    const [newStatus, setNewStatus] = React.useState(document?.status);

    React.useEffect(() => {
        setNewStatus(document?.status);
    }, [document]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{document?.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Status ändern</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => onStatusChange(newStatus)}
                            disabled={newStatus === document?.status}
                            className="mt-6"
                        >
                            Status aktualisieren
                        </Button>
                    </div>

                    {document?.versandstatus === 'versendet' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <h3 className="font-medium text-emerald-900 mb-2">📮 Versand-Information</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-emerald-600">Versandstatus</p>
                                    <p className="font-medium text-emerald-900">Versendet</p>
                                </div>
                                {document.versandt_am && (
                                    <div>
                                        <p className="text-emerald-600">Versendet am</p>
                                        <p className="font-medium text-emerald-900">
                                            {new Date(document.versandt_am).toLocaleString('de-DE')}
                                        </p>
                                    </div>
                                )}
                                {document.versandart && (
                                    <div>
                                        <p className="text-emerald-600">Versandart</p>
                                        <p className="font-medium text-emerald-900">
                                            {document.versandart === 'r1' ? 'Einschreiben Einwurf' : 
                                             document.versandart === 'r2' ? 'Einschreiben' : 'Normal'}
                                        </p>
                                    </div>
                                )}
                                {document.lxp_job_id && (
                                    <div>
                                        <p className="text-emerald-600">LetterXpress Job-ID</p>
                                        <p className="font-medium text-emerald-900">{document.lxp_job_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <div 
                            className="prose prose-sm max-w-none bg-white p-8 border rounded-lg"
                            dangerouslySetInnerHTML={{ __html: document?.content || '' }}
                        />
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                        {document?.pdf_url && (
                            <Button variant="outline" onClick={() => window.open(document.pdf_url, '_blank')}>
                                <Download className="w-4 h-4 mr-2" />
                                PDF herunterladen
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}