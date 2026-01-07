import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TemplateManager({ accountId }) {
    const [editDialog, setEditDialog] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const queryClient = useQueryClient();

    const { data: templates = [] } = useQuery({
        queryKey: ['whatsapp-templates', accountId],
        queryFn: () => base44.entities.WhatsAppTemplate.filter({ whatsapp_account_id: accountId }),
        enabled: !!accountId
    });

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (data.id) {
                await base44.entities.WhatsAppTemplate.update(data.id, data);
            } else {
                await base44.entities.WhatsAppTemplate.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
            setEditDialog(false);
            setCurrentTemplate(null);
            toast.success('Template gespeichert');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.WhatsAppTemplate.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
            toast.success('Template gelöscht');
        }
    });

    const handleEdit = (template) => {
        setCurrentTemplate(template || {
            whatsapp_account_id: accountId,
            template_name: '',
            anzeige_name: '',
            kategorie: 'utility',
            sprache: 'de',
            body_text: '',
            footer_text: '',
            platzhalter: [],
            meta_status: 'entwurf',
            verwendungen: 0
        });
        setEditDialog(true);
    };

    const getStatusBadge = (status) => {
        const configs = {
            entwurf: { color: 'bg-slate-100 text-slate-800', icon: Clock, label: 'Entwurf' },
            eingereicht: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Eingereicht' },
            genehmigt: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Genehmigt' },
            abgelehnt: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Abgelehnt' }
        };
        const config = configs[status] || configs.entwurf;
        const Icon = config.icon;
        return (
            <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">WhatsApp Templates</h3>
                <Button onClick={() => handleEdit(null)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Template
                </Button>
            </div>

            <div className="grid gap-4">
                {templates.map((template) => (
                    <Card key={template.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-base">{template.anzeige_name}</CardTitle>
                                    <p className="text-sm text-slate-600 mt-1">{template.template_name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(template.meta_status)}
                                    <Badge variant="outline">{template.verwendungen}x verwendet</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-700 mb-3">{template.body_text}</p>
                            <div className="flex gap-2">
                                <Badge variant="outline">{template.kategorie}</Badge>
                                <Badge variant="outline">{template.sprache.toUpperCase()}</Badge>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Bearbeiten
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        if (confirm('Template wirklich löschen?')) {
                                            deleteMutation.mutate(template.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Löschen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={editDialog} onOpenChange={setEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {currentTemplate?.id ? 'Template bearbeiten' : 'Neues Template erstellen'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Interner Name</Label>
                                <Input
                                    value={currentTemplate?.template_name || ''}
                                    onChange={(e) => setCurrentTemplate({ 
                                        ...currentTemplate, 
                                        template_name: e.target.value 
                                    })}
                                    placeholder="mieter_nebenkostenabrechnung"
                                />
                            </div>
                            <div>
                                <Label>Anzeigename</Label>
                                <Input
                                    value={currentTemplate?.anzeige_name || ''}
                                    onChange={(e) => setCurrentTemplate({ 
                                        ...currentTemplate, 
                                        anzeige_name: e.target.value 
                                    })}
                                    placeholder="Nebenkostenabrechnung"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Kategorie</Label>
                                <Select
                                    value={currentTemplate?.kategorie || 'utility'}
                                    onValueChange={(value) => setCurrentTemplate({ 
                                        ...currentTemplate, 
                                        kategorie: value 
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="utility">Verwaltung</SelectItem>
                                        <SelectItem value="authentication">Authentifizierung</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Sprache</Label>
                                <Select
                                    value={currentTemplate?.sprache || 'de'}
                                    onValueChange={(value) => setCurrentTemplate({ 
                                        ...currentTemplate, 
                                        sprache: value 
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="de">Deutsch</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Nachrichtentext</Label>
                            <Textarea
                                value={currentTemplate?.body_text || ''}
                                onChange={(e) => setCurrentTemplate({ 
                                    ...currentTemplate, 
                                    body_text: e.target.value 
                                })}
                                placeholder="Verwenden Sie {{1}}, {{2}} für Platzhalter"
                                rows={6}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Verwenden Sie {'{{'}{'{1}'}{'}}'}, {'{{'}{'{2}'}{'}}'} für Platzhalter
                            </p>
                        </div>

                        <div>
                            <Label>Footer (optional)</Label>
                            <Input
                                value={currentTemplate?.footer_text || ''}
                                onChange={(e) => setCurrentTemplate({ 
                                    ...currentTemplate, 
                                    footer_text: e.target.value 
                                })}
                                placeholder="z.B. Hausverwaltung Müller"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditDialog(false)}>
                                Abbrechen
                            </Button>
                            <Button 
                                onClick={() => saveMutation.mutate(currentTemplate)}
                                disabled={saveMutation.isPending}
                            >
                                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Speichern
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}