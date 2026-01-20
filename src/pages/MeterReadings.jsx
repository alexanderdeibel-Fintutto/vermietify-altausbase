import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gauge, Plus, Droplets, Zap, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

const meterTypeOptions = [
    { value: 'Strom', label: 'Strom' },
    { value: 'Wasser', label: 'Wasser' },
    { value: 'Heizung', label: 'Heizung' },
    { value: 'Gas', label: 'Gas' }
];

export default function MeterReadings() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        unit_id: '',
        zaehlertyp: 'Strom',
        zaehlernummer: '',
        zaehlerstand: '',
        ablesedatum: new Date().toISOString().split('T')[0]
    });

    const queryClient = useQueryClient();

    const { data: readings = [], isLoading } = useQuery({
        queryKey: ['meterReadings'],
        queryFn: () => base44.entities.MeterReading.list('-ablesedatum', 50)
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const createReadingMutation = useMutation({
        mutationFn: (data) => base44.entities.MeterReading.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meterReadings'] });
            setDialogOpen(false);
            setFormData({ unit_id: '', zaehlertyp: 'Strom', zaehlernummer: '', zaehlerstand: '', ablesedatum: new Date().toISOString().split('T')[0] });
            showSuccess('Zählerstand erfasst');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createReadingMutation.mutate(formData);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Wasser': return <Droplets className="w-6 h-6" />;
            case 'Strom': return <Zap className="w-6 h-6" />;
            case 'Heizung': return <Flame className="w-6 h-6" />;
            default: return <Gauge className="w-6 h-6" />;
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><div className="vf-spinner vf-spinner-lg" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Zählerstände</h1>
                    <p className="vf-page-subtitle">{readings.length} Ablesungen</p>
                </div>
                <div className="vf-page-actions">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="vf-btn-gradient">
                                <Plus className="w-4 h-4" />
                                Ablesung hinzufügen
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neue Zählerablesung</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <VfSelect
                                    label="Wohneinheit"
                                    value={formData.unit_id}
                                    onChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
                                    options={units.map(u => ({ value: u.id, label: u.nummer }))}
                                    required
                                />
                                <VfSelect
                                    label="Zählertyp"
                                    value={formData.zaehlertyp}
                                    onChange={(value) => setFormData(prev => ({ ...prev, zaehlertyp: value }))}
                                    options={meterTypeOptions}
                                />
                                <VfInput
                                    label="Zählernummer"
                                    value={formData.zaehlernummer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, zaehlernummer: e.target.value }))}
                                    placeholder="z.B. 12345678"
                                    required
                                />
                                <VfInput
                                    label="Zählerstand"
                                    type="number"
                                    value={formData.zaehlerstand}
                                    onChange={(e) => setFormData(prev => ({ ...prev, zaehlerstand: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Ablesedatum"
                                    type="date"
                                    value={formData.ablesedatum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ablesedatum: e.target.value }))}
                                    required
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Abbrechen
                                    </Button>
                                    <Button type="submit" className="vf-btn-gradient">
                                        Erfassen
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {readings.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Gauge className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">Noch keine Zählerstände</h3>
                            <p className="text-gray-600 mb-6">Erfassen Sie Ihren ersten Zählerstand</p>
                            <Button className="vf-btn-gradient" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Ersten Stand erfassen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {readings.map((reading) => {
                        const unit = units.find(u => u.id === reading.unit_id);
                        return (
                            <Card key={reading.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white">
                                                {getIcon(reading.zaehlertyp)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className="vf-badge-default">{reading.zaehlertyp}</Badge>
                                                    {unit && <span className="text-sm font-medium">{unit.nummer}</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    Zähler: {reading.zaehlernummer}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{reading.zaehlerstand}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(reading.ablesedatum).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}