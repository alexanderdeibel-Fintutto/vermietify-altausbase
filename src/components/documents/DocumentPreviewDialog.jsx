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