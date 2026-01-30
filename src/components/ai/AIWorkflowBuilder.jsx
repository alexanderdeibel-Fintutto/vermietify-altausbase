import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Plus, Edit2, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function AIWorkflowBuilder() {
    const [user, setUser] = useState(null);
    const [rules, setRules] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        loadUser();
        loadRules();
    }, []);

    async function loadUser() {
        const u = await base44.auth.me();
        setUser(u);
    }

    async function loadRules() {
        const r = await base44.entities.AIWorkflowRule.list('-created_date');
        setRules(r);
    }

    async function handleSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const data = {
            rule_name: formData.get('rule_name'),
            trigger_type: formData.get('trigger_type'),
            trigger_condition: {
                threshold: parseFloat(formData.get('threshold')) || 100,
                comparison: formData.get('comparison') || '>='
            },
            action_type: formData.get('action_type'),
            action_config: {
                recipient: formData.get('recipient'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                channel: formData.get('channel')
            },
            priority: formData.get('priority'),
            is_enabled: formData.get('is_enabled') === 'true'
        };

        try {
            if (editing) {
                await base44.entities.AIWorkflowRule.update(editing.id, data);
                toast.success('Regel aktualisiert');
            } else {
                await base44.entities.AIWorkflowRule.create(data);
                toast.success('Regel erstellt');
            }
            setShowDialog(false);
            setEditing(null);
            loadRules();
        } catch (error) {
            toast.error('Fehler beim Speichern');
        }
    }

    async function testRule(rule) {
        try {
            const { data } = await base44.functions.invoke('triggerAIWorkflow', {
                trigger_type: rule.trigger_type,
                trigger_data: { budget_percentage: 85, test: true }
            });
            toast.success(`${data.count} Regel(n) ausgeführt`);
        } catch (error) {
            toast.error('Test fehlgeschlagen');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Wirklich löschen?')) return;
        try {
            await base44.entities.AIWorkflowRule.delete(id);
            toast.success('Gelöscht');
            loadRules();
        } catch (error) {
            toast.error('Fehler');
        }
    }

    if (user?.role !== 'admin') {
        return <div className="p-6 text-center text-slate-600">Nur für Administratoren</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    AI Workflow-Automatisierung
                </h2>
                <Button onClick={() => { setEditing(null); setShowDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Regel
                </Button>
            </div>

            <div className="grid gap-4">
                {rules.map(rule => (
                    <Card key={rule.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => testRule(rule)}>
                                        <Play className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setEditing(rule); setShowDialog(true); }}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Trigger: </span>
                                    <span className="px-2 py-1 bg-slate-100 rounded">{rule.trigger_type}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Aktion: </span>
                                    <span className="px-2 py-1 bg-blue-100 rounded">{rule.action_type}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Priorität: </span>
                                    <span className={`px-2 py-1 rounded ${
                                        rule.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                        rule.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        'bg-slate-100'
                                    }`}>{rule.priority}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Status: </span>
                                    <span className={rule.is_enabled ? 'text-green-600' : 'text-slate-400'}>
                                        {rule.is_enabled ? 'Aktiv' : 'Inaktiv'}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Ausgelöst: </span>
                                    <span>{rule.trigger_count || 0}x</span>
                                    {rule.last_triggered && (
                                        <span className="text-slate-600 ml-2">
                                            (zuletzt: {new Date(rule.last_triggered).toLocaleString('de-DE')})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Regel bearbeiten' : 'Neue Workflow-Regel'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Regelname</Label>
                            <Input name="rule_name" defaultValue={editing?.rule_name} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Trigger</Label>
                                <Select name="trigger_type" defaultValue={editing?.trigger_type || 'budget_exceeded'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="budget_exceeded">Budget überschritten</SelectItem>
                                        <SelectItem value="rate_limit_hit">Rate-Limit erreicht</SelectItem>
                                        <SelectItem value="document_urgent">Dringendes Dokument</SelectItem>
                                        <SelectItem value="cost_threshold">Kosten-Schwelle</SelectItem>
                                        <SelectItem value="pattern_detected">Muster erkannt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Schwellenwert (%)</Label>
                                <Input name="threshold" type="number" defaultValue={editing?.trigger_condition?.threshold || 80} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Aktion</Label>
                                <Select name="action_type" defaultValue={editing?.action_type || 'send_email'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="send_email">E-Mail senden</SelectItem>
                                        <SelectItem value="create_task">Task erstellen</SelectItem>
                                        <SelectItem value="send_notification">Benachrichtigung</SelectItem>
                                        <SelectItem value="slack_message">Slack-Nachricht</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priorität</Label>
                                <Select name="priority" defaultValue={editing?.priority || 'medium'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Niedrig</SelectItem>
                                        <SelectItem value="medium">Mittel</SelectItem>
                                        <SelectItem value="high">Hoch</SelectItem>
                                        <SelectItem value="critical">Kritisch</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Empfänger/Kanal</Label>
                            <Input 
                                name="recipient" 
                                defaultValue={editing?.action_config?.recipient || editing?.action_config?.channel}
                                placeholder="E-Mail oder #slack-channel"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Betreff/Titel (optional)</Label>
                            <Input name="subject" defaultValue={editing?.action_config?.subject} />
                        </div>

                        <div className="space-y-2">
                            <Label>Nachricht</Label>
                            <Textarea name="message" rows={4} defaultValue={editing?.action_config?.message} />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select name="is_enabled" defaultValue={editing?.is_enabled !== false ? 'true' : 'false'}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Aktiv</SelectItem>
                                    <SelectItem value="false">Inaktiv</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">Speichern</Button>
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                Abbrechen
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}