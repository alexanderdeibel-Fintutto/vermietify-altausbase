import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link2, Plus, X, Search } from 'lucide-react';

export default function BugLinkingDialog({ open, onOpenChange, problem }) {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data: features = [] } = useQuery({
        queryKey: ['project-features-for-linking'],
        queryFn: () => base44.entities.ProjectFeature.list('-created_date', 200),
        enabled: open
    });

    const linkMutation = useMutation({
        mutationFn: async (featureId) => {
            const feature = features.find(f => f.id === featureId);
            const currentBugs = feature.verknuepfte_bugs || [];
            
            if (currentBugs.includes(problem.id)) {
                toast.info('Bug ist bereits verknüpft');
                return;
            }

            return base44.entities.ProjectFeature.update(featureId, {
                verknuepfte_bugs: [...currentBugs, problem.id]
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-features-for-linking'] });
            queryClient.invalidateQueries({ queryKey: ['project-features'] });
            toast.success('Bug erfolgreich verknüpft');
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const unlinkMutation = useMutation({
        mutationFn: async (featureId) => {
            const feature = features.find(f => f.id === featureId);
            const currentBugs = feature.verknuepfte_bugs || [];
            
            return base44.entities.ProjectFeature.update(featureId, {
                verknuepfte_bugs: currentBugs.filter(id => id !== problem.id)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-features-for-linking'] });
            queryClient.invalidateQueries({ queryKey: ['project-features'] });
            toast.success('Verknüpfung entfernt');
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const linkedFeatures = features.filter(f => 
        f.verknuepfte_bugs && f.verknuepfte_bugs.includes(problem?.id)
    );

    const availableFeatures = features.filter(f => {
        if (f.verknuepfte_bugs && f.verknuepfte_bugs.includes(problem?.id)) return false;
        if (searchQuery && !f.titel.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        Bug mit Features verknüpfen
                    </DialogTitle>
                    <p className="text-sm text-slate-600">
                        Problem: {problem?.problem_titel}
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Bereits verknüpfte Features */}
                    {linkedFeatures.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Verknüpfte Features ({linkedFeatures.length})</h3>
                            <div className="space-y-2">
                                {linkedFeatures.map(feature => (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                                    >
                                        <Link2 className="w-4 h-4 text-emerald-600" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{feature.titel}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline">{feature.status}</Badge>
                                                <Badge variant="outline">{feature.prioritaet}</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => unlinkMutation.mutate(feature.id)}
                                            disabled={unlinkMutation.isPending}
                                        >
                                            <X className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suche nach verfügbaren Features */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Verfügbare Features</h3>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Nach Features suchen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {availableFeatures.length === 0 ? (
                                <p className="text-center text-slate-600 py-4">
                                    Keine weiteren Features gefunden
                                </p>
                            ) : (
                                availableFeatures.map(feature => (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{feature.titel}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline">{feature.status}</Badge>
                                                <Badge variant="outline">{feature.prioritaet}</Badge>
                                                {feature.kategorie && (
                                                    <Badge variant="outline">{feature.kategorie}</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => linkMutation.mutate(feature.id)}
                                            disabled={linkMutation.isPending}
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Verknüpfen
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => onOpenChange(false)}>
                            Fertig
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}