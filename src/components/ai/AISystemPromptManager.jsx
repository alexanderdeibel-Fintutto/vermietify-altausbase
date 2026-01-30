import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AISystemPromptManager() {
    const [user, setUser] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        loadUser();
        loadPrompts();
    }, []);

    async function loadUser() {
        const u = await base44.auth.me();
        setUser(u);
    }

    async function loadPrompts() {
        const p = await base44.entities.AISystemPrompt.list('-created_date');
        setPrompts(p);
    }

    async function handleSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const data = {
            feature_key: formData.get('feature_key'),
            custom_name: formData.get('custom_name'),
            system_prompt: formData.get('system_prompt'),
            is_active: formData.get('is_active') === 'true',
            created_by_email: user.email,
            last_modified_by: user.email
        };

        try {
            if (editing) {
                await base44.entities.AISystemPrompt.update(editing.id, data);
                toast.success('Prompt aktualisiert');
            } else {
                await base44.entities.AISystemPrompt.create(data);
                toast.success('Prompt erstellt');
            }
            setShowDialog(false);
            setEditing(null);
            loadPrompts();
        } catch (error) {
            toast.error('Fehler beim Speichern');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Wirklich löschen?')) return;
        try {
            await base44.entities.AISystemPrompt.delete(id);
            toast.success('Gelöscht');
            loadPrompts();
        } catch (error) {
            toast.error('Fehler beim Löschen');
        }
    }

    if (user?.role !== 'admin') {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-600">Nur für Administratoren</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    System-Prompt Verwaltung
                </h2>
                <Button onClick={() => { setEditing(null); setShowDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Prompt
                </Button>
            </div>

            <div className="grid gap-4">
                {prompts.map(prompt => (
                    <Card key={prompt.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {prompt.custom_name}
                                    {prompt.is_active && <CheckCircle className="w-4 h-4 text-green-600" />}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => { setEditing(prompt); setShowDialog(true); }}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => handleDelete(prompt.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-sm">
                                    <span className="font-medium">Feature: </span>
                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs">{prompt.feature_key}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded text-sm font-mono whitespace-pre-wrap">
                                    {prompt.system_prompt}
                                </div>
                                <div className="flex gap-4 text-xs text-slate-600">
                                    <div>Verwendet: {prompt.usage_count || 0}x</div>
                                    <div>Erstellt von: {prompt.created_by_email}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'System-Prompt bearbeiten' : 'Neuer System-Prompt'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Feature</Label>
                            <Select name="feature_key" defaultValue={editing?.feature_key || 'chat'}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chat">Chat</SelectItem>
                                    <SelectItem value="ocr">OCR</SelectItem>
                                    <SelectItem value="analysis">Analyse</SelectItem>
                                    <SelectItem value="categorization">Kategorisierung</SelectItem>
                                    <SelectItem value="document_gen">Dokument-Generierung</SelectItem>
                                    <SelectItem value="recommendation">Empfehlungen</SelectItem>
                                    <SelectItem value="other">Sonstige</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input 
                                name="custom_name" 
                                defaultValue={editing?.custom_name}
                                placeholder="z.B. Vermieter-Chat Prompt"
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>System-Prompt</Label>
                            <Textarea 
                                name="system_prompt"
                                defaultValue={editing?.system_prompt}
                                rows={8}
                                placeholder="Du bist ein hilfreicher Assistent..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select name="is_active" defaultValue={editing?.is_active ? 'true' : 'true'}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
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