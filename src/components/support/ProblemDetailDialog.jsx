import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Clock, User, Monitor, Tag, Link as LinkIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ProblemDetailDialog({ problem, open, onOpenChange }) {
    const [editData, setEditData] = useState({
        status: problem.status,
        bearbeiter_email: problem.bearbeiter_email || '',
        loesung_beschreibung: problem.loesung_beschreibung || '',
        entwickler_notizen: problem.entwickler_notizen || '',
        workaround: problem.workaround || ''
    });

    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            // Berechne Lösungszeit wenn gelöst
            if (data.status === 'Gelöst' && !problem.geloest_am) {
                const created = new Date(problem.created_date);
                const now = new Date();
                const diffHours = (now - created) / (1000 * 60 * 60);
                data.geloest_am = now.toISOString();
                data.loesungszeit_stunden = diffHours;
            }

            return base44.entities.UserProblem.update(problem.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-problems'] });
            toast.success('Problem aktualisiert');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const handleSave = () => {
        updateMutation.mutate(editData);
    };

    const handleSendAndClose = () => {
        updateMutation.mutate({
            ...editData,
            status: 'Gelöst'
        });
    };

    const severityIcons = {
        'Kritisch': <AlertCircle className="w-4 h-4 text-red-600" />,
        'Hoch': <AlertCircle className="w-4 h-4 text-orange-600" />,
        'Mittel': <Clock className="w-4 h-4 text-yellow-600" />,
        'Niedrig': <CheckCircle2 className="w-4 h-4 text-blue-600" />,
        'Kosmetisch': <CheckCircle2 className="w-4 h-4 text-slate-600" />
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {severityIcons[problem.schweregrad]}
                        Problem #{problem.id.substring(0, 8).toUpperCase()}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="solution">Lösung</TabsTrigger>
                        <TabsTrigger value="technical">Technisch</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                        {/* Problem-Info */}
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-lg">{problem.problem_titel}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant="outline">{problem.kategorie}</Badge>
                                    {problem.betroffenes_modul && (
                                        <Badge variant="outline">{problem.betroffenes_modul}</Badge>
                                    )}
                                    {problem.ist_bug && <Badge className="bg-red-100 text-red-800">Bug</Badge>}
                                    {problem.ist_feature_request && <Badge className="bg-blue-100 text-blue-800">Feature</Badge>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">User:</span>
                                    <span className="font-medium">{problem.created_by || 'Anonym'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">Gemeldet:</span>
                                    <span className="font-medium">
                                        {problem.created_date ? new Date(problem.created_date).toLocaleString('de-DE') : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-2">Beschreibung</h4>
                                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                                    {problem.problem_beschreibung}
                                </p>
                            </div>

                            {problem.screenshots && problem.screenshots.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Screenshots ({problem.screenshots.length})</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {problem.screenshots.map((url, i) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt={`Screenshot ${i + 1}`}
                                                className="rounded-lg border"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {problem.workaround && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                        Workaround
                                    </h4>
                                    <p className="text-sm text-slate-700">{problem.workaround}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="solution" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={editData.status}
                                    onValueChange={(value) => setEditData({ ...editData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Neu">Neu</SelectItem>
                                        <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                                        <SelectItem value="Gelöst">Gelöst</SelectItem>
                                        <SelectItem value="Kann nicht reproduzieren">Kann nicht reproduzieren</SelectItem>
                                        <SelectItem value="Wont-Fix">Wont-Fix</SelectItem>
                                        <SelectItem value="Duplikat">Duplikat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="bearbeiter">Zugewiesen an</Label>
                                <Input
                                    id="bearbeiter"
                                    placeholder="email@example.com"
                                    value={editData.bearbeiter_email}
                                    onChange={(e) => setEditData({ ...editData, bearbeiter_email: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="loesung">Lösung / Antwort an User</Label>
                                <Textarea
                                    id="loesung"
                                    rows={6}
                                    placeholder="Beschreiben Sie wie das Problem gelöst wurde..."
                                    value={editData.loesung_beschreibung}
                                    onChange={(e) => setEditData({ ...editData, loesung_beschreibung: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="workaround">Workaround (falls noch nicht gefixt)</Label>
                                <Textarea
                                    id="workaround"
                                    rows={3}
                                    placeholder="Temporäre Lösung..."
                                    value={editData.workaround}
                                    onChange={(e) => setEditData({ ...editData, workaround: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="dev_notes">Interne Notizen (nicht für User sichtbar)</Label>
                                <Textarea
                                    id="dev_notes"
                                    rows={4}
                                    placeholder="Entwickler-Notizen, technische Details..."
                                    value={editData.entwickler_notizen}
                                    onChange={(e) => setEditData({ ...editData, entwickler_notizen: e.target.value })}
                                />
                            </div>

                            {problem.verwandte_problem_ids && problem.verwandte_problem_ids.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4" />
                                        Ähnliche Probleme ({problem.verwandte_problem_ids.length})
                                    </h4>
                                    <div className="text-sm text-slate-600">
                                        IDs: {problem.verwandte_problem_ids.join(', ')}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Abbrechen
                            </Button>
                            <Button variant="outline" onClick={handleSave}>
                                Speichern
                            </Button>
                            <Button onClick={handleSendAndClose}>
                                Senden & Schließen
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="technical" className="space-y-4">
                        <div className="space-y-3">
                            {problem.browser_info && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Monitor className="w-4 h-4" />
                                        Browser-Informationen
                                    </h4>
                                    <div className="bg-slate-50 p-4 rounded-lg space-y-1 text-sm">
                                        <div><span className="font-medium">Browser:</span> {problem.browser_info.browser}</div>
                                        <div><span className="font-medium">Version:</span> {problem.browser_info.version}</div>
                                        <div><span className="font-medium">OS:</span> {problem.browser_info.os}</div>
                                        <div><span className="font-medium">Auflösung:</span> {problem.browser_info.screen_resolution}</div>
                                    </div>
                                </div>
                            )}

                            {problem.betroffene_seite_url && (
                                <div>
                                    <h4 className="font-semibold mb-2">Betroffene Seite</h4>
                                    <a 
                                        href={problem.betroffene_seite_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline break-all"
                                    >
                                        {problem.betroffene_seite_url}
                                    </a>
                                </div>
                            )}

                            {problem.error_log && (
                                <div>
                                    <h4 className="font-semibold mb-2">Error-Log</h4>
                                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                                        {problem.error_log}
                                    </pre>
                                </div>
                            )}

                            {problem.tags && problem.tags.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {problem.tags.map((tag, i) => (
                                            <Badge key={i} variant="outline">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {problem.github_issue_url && (
                                <div>
                                    <h4 className="font-semibold mb-2">GitHub Issue</h4>
                                    <a 
                                        href={problem.github_issue_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {problem.github_issue_url}
                                    </a>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {problem.anzahl_duplikate > 1 && (
                                    <div>
                                        <h4 className="font-semibold mb-1">Duplikate</h4>
                                        <div className="text-2xl font-bold text-orange-600">
                                            {problem.anzahl_duplikate}x
                                        </div>
                                    </div>
                                )}
                                {problem.loesungszeit_stunden && (
                                    <div>
                                        <h4 className="font-semibold mb-1">Lösungszeit</h4>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {problem.loesungszeit_stunden.toFixed(1)}h
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}