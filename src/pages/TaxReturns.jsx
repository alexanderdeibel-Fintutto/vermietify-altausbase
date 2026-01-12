import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Send, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ElsterStatusBadge from '@/components/elster/ElsterStatusBadge';

export default function TaxReturns() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newYear, setNewYear] = useState(new Date().getFullYear() - 1);
    const [filingStatus, setFilingStatus] = useState('single');

    const { data: taxReturns = [] } = useQuery({
        queryKey: ['taxReturns'],
        queryFn: async () => {
            const returns = await base44.entities.TaxReturn.list();
            return returns.sort((a, b) => b.tax_year - a.tax_year);
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const user = await base44.auth.me();
            return base44.entities.TaxReturn.create({
                tax_year: newYear,
                status: 'draft',
                filing_status: filingStatus,
                taxpayer_name: user.full_name
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['taxReturns']);
            setDialogOpen(false);
            toast.success('Steuererklärung erstellt');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.TaxReturn.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['taxReturns']);
            toast.success('Steuererklärung gelöscht');
        }
    });

    const getProgressPercent = (status) => {
        const steps = {
            'draft': 20,
            'in_progress': 40,
            'ready_for_review': 60,
            'submitted': 80,
            'accepted': 100,
            'rejected': 60
        };
        return steps[status] || 0;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Meine Steuererklärungen</h1>
                    <p className="text-slate-500 mt-1">Übersicht aller Steuererklärungen</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Neue Steuererklärung
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Neue Steuererklärung erstellen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Steuerjahr</label>
                                <Select value={newYear.toString()} onValueChange={(v) => setNewYear(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2023, 2022, 2021].map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">Veranlagungsart</label>
                                <Select value={filingStatus} onValueChange={setFilingStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Einzelveranlagung</SelectItem>
                                        <SelectItem value="married_joint">Zusammenveranlagung</SelectItem>
                                        <SelectItem value="married_separate">Getrennte Veranlagung</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button 
                                onClick={() => createMutation.mutate()} 
                                disabled={createMutation.isPending}
                                className="w-full"
                            >
                                Erstellen
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Steuererklärungen Liste */}
            {taxReturns.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">Noch keine Steuererklärungen</p>
                        <p className="text-slate-500 mb-4">
                            Erstellen Sie Ihre erste Steuererklärung
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {taxReturns.map(taxReturn => (
                        <Card key={taxReturn.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-medium text-slate-900">
                                                Steuererklärung {taxReturn.tax_year}
                                            </h3>
                                            <ElsterStatusBadge status={taxReturn.status} />
                                        </div>

                                        <div className="space-y-2 text-sm mb-4">
                                            <div className="flex gap-2">
                                                <span className="text-slate-600">Veranlagungsart:</span>
                                                <span className="font-medium">
                                                    {taxReturn.filing_status === 'single' ? 'Einzelveranlagung' : 
                                                     taxReturn.filing_status === 'married_joint' ? 'Zusammenveranlagung' : 'Getrennte Veranlagung'}
                                                </span>
                                            </div>
                                            {taxReturn.elster_transfer_ticket && (
                                                <div className="flex gap-2">
                                                    <span className="text-slate-600">Transferticket:</span>
                                                    <span className="font-mono text-xs">{taxReturn.elster_transfer_ticket}</span>
                                                </div>
                                            )}
                                            {taxReturn.submission_date && (
                                                <div className="flex gap-2">
                                                    <span className="text-slate-600">Übermittelt am:</span>
                                                    <span className="font-medium">
                                                        {new Date(taxReturn.submission_date).toLocaleString('de-DE')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Fortschritt */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                <span>Fortschritt</span>
                                                <span>{getProgressPercent(taxReturn.status)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${getProgressPercent(taxReturn.status)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link to={`${createPageUrl('TaxReturnDetail')}?id=${taxReturn.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Öffnen
                                            </Button>
                                        </Link>
                                        {taxReturn.status === 'ready_for_review' && (
                                            <Link to={`${createPageUrl('ElsterSubmit')}?tax_return_id=${taxReturn.id}`}>
                                                <Button size="sm" className="gap-2">
                                                    <Send className="h-4 w-4" />
                                                    Übermitteln
                                                </Button>
                                            </Link>
                                        )}
                                        {taxReturn.status === 'draft' && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => deleteMutation.mutate(taxReturn.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}