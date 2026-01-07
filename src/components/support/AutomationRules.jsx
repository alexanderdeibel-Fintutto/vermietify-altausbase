import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationRules() {
    const [rules, setRules] = useState([
        {
            id: '1',
            name: 'Auto-Priorität für Kritische Probleme',
            trigger: 'schweregrad',
            condition: 'Kritisch',
            action: 'notify_team',
            active: true
        },
        {
            id: '2',
            name: 'Auto-Zuweisung an Dev-Team',
            trigger: 'kategorie',
            condition: 'Bug',
            action: 'assign_developer',
            active: true
        },
        {
            id: '3',
            name: 'Feature-Request Auto-Label',
            trigger: 'kategorie',
            condition: 'Feature-Request',
            action: 'add_to_backlog',
            active: false
        }
    ]);

    const [newRule, setNewRule] = useState({
        name: '',
        trigger: '',
        condition: '',
        action: '',
        active: true
    });

    const addRule = () => {
        if (!newRule.name || !newRule.trigger || !newRule.action) {
            toast.error('Bitte alle Felder ausfüllen');
            return;
        }

        setRules([
            ...rules,
            {
                ...newRule,
                id: Date.now().toString()
            }
        ]);

        setNewRule({
            name: '',
            trigger: '',
            condition: '',
            action: '',
            active: true
        });

        toast.success('Regel hinzugefügt');
    };

    const deleteRule = (id) => {
        setRules(rules.filter(r => r.id !== id));
        toast.success('Regel gelöscht');
    };

    const toggleRule = (id) => {
        setRules(rules.map(r =>
            r.id === id ? { ...r, active: !r.active } : r
        ));
    };

    const saveRules = () => {
        // In Produktion: API-Call zum Speichern
        toast.success('Regeln gespeichert');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Automatisierungs-Regeln
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                        Automatische Aktionen bei bestimmten Bedingungen
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Bestehende Regeln */}
                        {rules.map(rule => (
                            <div
                                key={rule.id}
                                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <Switch
                                    checked={rule.active}
                                    onCheckedChange={() => toggleRule(rule.id)}
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{rule.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                                        <Badge variant="outline">Wenn: {rule.trigger}</Badge>
                                        <span>→</span>
                                        <Badge variant="outline">Wert: {rule.condition}</Badge>
                                        <span>→</span>
                                        <Badge variant="outline">Dann: {rule.action}</Badge>
                                    </div>
                                </div>
                                <Badge className={rule.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                                    {rule.active ? 'Aktiv' : 'Inaktiv'}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteRule(rule.id)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Neue Regel hinzufügen */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Neue Regel erstellen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Regelname</Label>
                            <Input
                                value={newRule.name}
                                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                placeholder="z.B. Auto-Eskalation bei Kritisch"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Trigger (Wenn)</Label>
                                <Select
                                    value={newRule.trigger}
                                    onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="schweregrad">Schweregrad</SelectItem>
                                        <SelectItem value="kategorie">Kategorie</SelectItem>
                                        <SelectItem value="status">Status</SelectItem>
                                        <SelectItem value="modul">Modul</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Bedingung (Wert)</Label>
                                <Input
                                    value={newRule.condition}
                                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                                    placeholder="z.B. Kritisch"
                                />
                            </div>

                            <div>
                                <Label>Aktion (Dann)</Label>
                                <Select
                                    value={newRule.action}
                                    onValueChange={(value) => setNewRule({ ...newRule, action: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Auswählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="notify_team">Team benachrichtigen</SelectItem>
                                        <SelectItem value="assign_developer">Developer zuweisen</SelectItem>
                                        <SelectItem value="escalate">Eskalieren</SelectItem>
                                        <SelectItem value="add_to_backlog">Zum Backlog hinzufügen</SelectItem>
                                        <SelectItem value="auto_reply">Auto-Antwort senden</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button onClick={addRule}>
                                <Plus className="w-4 h-4 mr-2" />
                                Regel hinzufügen
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Speichern */}
            <div className="flex justify-end">
                <Button onClick={saveRules} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />
                    Alle Regeln speichern
                </Button>
            </div>
        </div>
    );
}