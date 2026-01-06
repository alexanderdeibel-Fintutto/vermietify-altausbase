import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Sparkles, 
    FileText, 
    Shield, 
    CreditCard, 
    Home,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import BookingPreviewDialog from './BookingPreviewDialog';

export default function BookingOnboardingDialog({ open, onOpenChange, buildingId }) {
    const [step, setStep] = useState(1);
    const [selectedSource, setSelectedSource] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const { data: propertytaxes = [] } = useQuery({
        queryKey: ['propertytaxes', buildingId],
        queryFn: () => base44.entities.PropertyTax.filter({ 
            building_id: buildingId,
            bookings_created: false 
        }),
        enabled: !!buildingId
    });

    const { data: insurances = [] } = useQuery({
        queryKey: ['insurances', buildingId],
        queryFn: () => base44.entities.Insurance.filter({ 
            building_id: buildingId,
            bookings_created: false 
        }),
        enabled: !!buildingId
    });

    const { data: financings = [] } = useQuery({
        queryKey: ['financings', buildingId],
        queryFn: () => base44.entities.Financing.filter({ 
            building_id: buildingId,
            bookings_created: false 
        }),
        enabled: !!buildingId
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers', buildingId],
        queryFn: () => base44.entities.Supplier.filter({ 
            building_id: buildingId,
            bookings_created: false 
        }),
        enabled: !!buildingId
    });

    const sources = [
        {
            type: 'Grundsteuer',
            icon: Home,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            items: propertytaxes,
            description: 'Quartalsraten aus Grundsteuerbescheid'
        },
        {
            type: 'Versicherung',
            icon: Shield,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            items: insurances,
            description: 'Prämien nach Zahlungsrhythmus'
        },
        {
            type: 'Kredit',
            icon: CreditCard,
            color: 'text-red-600',
            bg: 'bg-red-50',
            items: financings,
            description: 'Tilgung und Zinsen getrennt'
        },
        {
            type: 'Versorger',
            icon: FileText,
            color: 'text-green-600',
            bg: 'bg-green-50',
            items: suppliers,
            description: 'Regelmäßige Abschlagszahlungen'
        }
    ];

    const handleSelectSource = (source, item) => {
        setSelectedSource({ type: source.type, id: item.id });
        setPreviewOpen(true);
    };

    const totalAvailable = sources.reduce((sum, s) => sum + s.items.length, 0);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                            Automatische Buchungsgenerierung
                        </DialogTitle>
                    </DialogHeader>

                    {step === 1 && (
                        <div className="space-y-6">
                            <Card className="border-emerald-200 bg-emerald-50">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-emerald-900 mb-2">
                                        Willkommen zur automatischen Buchungsgenerierung!
                                    </h3>
                                    <p className="text-emerald-800 text-sm">
                                        Das System kann aus Ihren bestehenden Verträgen und Bescheiden 
                                        automatisch wiederkehrende Buchungen generieren. Dies spart Zeit 
                                        und stellt sicher, dass keine Zahlungen vergessen werden.
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-800">
                                        Verfügbare Quellen ({totalAvailable})
                                    </h3>
                                </div>

                                {sources.map((source) => {
                                    const Icon = source.icon;
                                    return (
                                        <Card key={source.type} className={source.items.length > 0 ? '' : 'opacity-50'}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${source.bg}`}>
                                                            <Icon className={`w-5 h-5 ${source.color}`} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-800">
                                                                {source.type}
                                                            </h4>
                                                            <p className="text-sm text-slate-600">
                                                                {source.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">
                                                        {source.items.length} verfügbar
                                                    </Badge>
                                                </div>

                                                {source.items.length > 0 && (
                                                    <div className="space-y-2 mt-4 pl-12">
                                                        {source.items.map((item) => (
                                                            <div 
                                                                key={item.id}
                                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                                            >
                                                                <span className="text-sm text-slate-700">
                                                                    {item.name || item.versicherungstyp || item.supplier_type || 
                                                                     `${source.type} ${item.grundsteuerbescheid_jahr || ''}`}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleSelectSource(source, item)}
                                                                    className="gap-1"
                                                                >
                                                                    Buchungen generieren
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {totalAvailable === 0 && (
                                    <Card className="border-slate-200">
                                        <CardContent className="p-8 text-center">
                                            <p className="text-slate-600">
                                                Keine Quellen gefunden. Legen Sie zuerst Verträge, 
                                                Versicherungen oder Bescheide an.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {selectedSource && (
                <BookingPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    sourceType={selectedSource.type}
                    sourceId={selectedSource.id}
                    onSuccess={() => {
                        setPreviewOpen(false);
                        onOpenChange(false);
                    }}
                />
            )}
        </>
    );
}