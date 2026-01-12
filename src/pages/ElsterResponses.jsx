import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Eye, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ElsterResponses() {
    const queryClient = useQueryClient();
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);

    const { data: responses = [] } = useQuery({
        queryKey: ['elsterResponses'],
        queryFn: async () => {
            const resp = await base44.entities.ElsterResponse.list();
            return resp.sort((a, b) => new Date(b.received_date) - new Date(a.received_date));
        }
    });

    const { data: taxReturns = [] } = useQuery({
        queryKey: ['taxReturns'],
        queryFn: () => base44.entities.TaxReturn.list()
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => base44.entities.ElsterResponse.update(id, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries(['elsterResponses']);
        }
    });

    const handleViewDetails = (response) => {
        setSelectedResponse(response);
        setDetailDialogOpen(true);
        if (!response.is_read) {
            markAsReadMutation.mutate(response.id);
        }
    };

    const filteredResponses = responses.filter(r => {
        const taxReturn = taxReturns.find(tr => tr.id === r.tax_return_id);
        if (selectedYear !== 'all' && taxReturn?.tax_year !== parseInt(selectedYear)) return false;
        if (selectedType !== 'all' && r.response_type !== selectedType) return false;
        return true;
    });

    const unreadCount = responses.filter(r => !r.is_read).length;

    const getResponseTypeConfig = (type) => {
        const configs = {
            confirmation: { label: 'Bestätigung', icon: CheckCircle2, color: 'text-green-600' },
            assessment: { label: 'Steuerbescheid', icon: FileText, color: 'text-blue-600' },
            rejection: { label: 'Ablehnung', icon: XCircle, color: 'text-red-600' },
            query: { label: 'Rückfrage', icon: AlertTriangle, color: 'text-yellow-600' },
            correction_request: { label: 'Korrekturanforderung', icon: AlertTriangle, color: 'text-orange-600' }
        };
        return configs[type] || { label: type, icon: FileText, color: 'text-slate-600' };
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light text-slate-900">Antworten vom Finanzamt</h1>
                    <p className="text-slate-500 mt-1">
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">{unreadCount} ungelesen</Badge>
                        )}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-sm text-slate-600 mb-2 block">Jahr</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Jahre</SelectItem>
                                    {[2024, 2023, 2022, 2021].map(year => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-slate-600 mb-2 block">Typ</label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Typen</SelectItem>
                                    <SelectItem value="confirmation">Bestätigung</SelectItem>
                                    <SelectItem value="assessment">Steuerbescheid</SelectItem>
                                    <SelectItem value="rejection">Ablehnung</SelectItem>
                                    <SelectItem value="query">Rückfrage</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Antworten Liste */}
            {filteredResponses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-slate-400">
                        Keine Antworten vorhanden
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredResponses.map(response => {
                        const config = getResponseTypeConfig(response.response_type);
                        const Icon = config.icon;
                        const taxReturn = taxReturns.find(tr => tr.id === response.tax_return_id);

                        return (
                            <Card 
                                key={response.id}
                                className={`cursor-pointer hover:shadow-md transition-shadow ${!response.is_read ? 'border-blue-300 border-2' : ''}`}
                                onClick={() => handleViewDetails(response)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Icon className={`h-6 w-6 ${config.color} flex-shrink-0 mt-1`} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium text-slate-900">{config.label}</h3>
                                                {taxReturn && (
                                                    <Badge variant="outline">Jahr {taxReturn.tax_year}</Badge>
                                                )}
                                                {!response.is_read && (
                                                    <Badge variant="destructive">Neu</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Empfangen: {new Date(response.received_date).toLocaleString('de-DE')}
                                            </p>
                                            {response.assessed_tax && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                                    <p className="text-sm text-slate-600">Festgesetzte Steuer</p>
                                                    <p className="text-xl font-medium text-slate-900">
                                                        {formatCurrency(response.assessed_tax)}
                                                    </p>
                                                    {response.difference_to_declaration !== 0 && (
                                                        <p className={`text-sm mt-1 ${response.difference_to_declaration > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {response.difference_to_declaration > 0 ? 'Nachzahlung' : 'Erstattung'}: {formatCurrency(Math.abs(response.difference_to_declaration))}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Antwort Details</DialogTitle>
                    </DialogHeader>
                    {selectedResponse && (
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-600">Typ</p>
                                    <p className="font-medium">{getResponseTypeConfig(selectedResponse.response_type).label}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Empfangen</p>
                                    <p className="font-medium">{new Date(selectedResponse.received_date).toLocaleString('de-DE')}</p>
                                </div>
                            </div>

                            {selectedResponse.assessed_tax && (
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">Festgesetzte Steuer</p>
                                            <p className="text-xl font-medium">{formatCurrency(selectedResponse.assessed_tax)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Abweichung</p>
                                            <p className={`text-xl font-medium ${selectedResponse.difference_to_declaration > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(selectedResponse.difference_to_declaration)}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedResponse.due_date && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm text-slate-600">Zahlungsfrist</p>
                                            <p className="font-medium">{new Date(selectedResponse.due_date).toLocaleDateString('de-DE')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedResponse.difference_to_declaration && Math.abs(selectedResponse.difference_to_declaration) > 100 && (
                                <Alert className="border-yellow-200 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-900 text-sm">
                                        <strong>Hinweis:</strong> Die Abweichung beträgt {formatCurrency(Math.abs(selectedResponse.difference_to_declaration))}. 
                                        Sie sollten prüfen, ob ein Einspruch sinnvoll ist.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {selectedResponse.response_file_uri && (
                                <Button variant="outline" className="w-full gap-2">
                                    <Download className="h-4 w-4" />
                                    Original-Dokument herunterladen
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}