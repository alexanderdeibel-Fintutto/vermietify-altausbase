import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    DollarSign,
    Building2,
    Filter,
    Search,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    Sparkles
} from 'lucide-react';
import BookingEditorDialog from '@/components/bookings/BookingEditorDialog';
import BookingOnboardingDialog from '@/components/bookings/BookingOnboardingDialog';
import { toast } from 'sonner';

export default function GeneratedBookings() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceTypeFilter, setSourceTypeFilter] = useState('all');
    const [selectedBuilding, setSelectedBuilding] = useState('all');
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['generatedBookings'],
        queryFn: () => base44.entities.GeneratedFinancialBooking.list('-due_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.GeneratedFinancialBooking.delete(id),
        onSuccess: () => {
            toast.success('Buchung gelöscht');
            queryClient.invalidateQueries({ queryKey: ['generatedBookings'] });
        }
    });

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = booking.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
        const matchesSourceType = sourceTypeFilter === 'all' || booking.source_type === sourceTypeFilter;
        const matchesBuilding = selectedBuilding === 'all' || booking.building_id === selectedBuilding;
        return matchesSearch && matchesStatus && matchesSourceType && matchesBuilding;
    });

    // Statistics
    const stats = {
        total: bookings.length,
        planned: bookings.filter(b => b.booking_status === 'Geplant').length,
        paid: bookings.filter(b => b.booking_status === 'Bezahlt').length,
        overdue: bookings.filter(b => {
            const dueDate = new Date(b.due_date);
            const today = new Date();
            return dueDate < today && b.booking_status !== 'Bezahlt';
        }).length,
        totalAmount: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
        paidAmount: bookings.reduce((sum, b) => sum + (b.paid_amount || 0), 0)
    };

    const getStatusBadge = (status) => {
        const config = {
            'Geplant': { variant: 'secondary', icon: Clock, label: 'Geplant' },
            'Gebucht': { variant: 'default', icon: CheckCircle2, label: 'Gebucht' },
            'TeilweiseBezahlt': { variant: 'warning', icon: AlertCircle, label: 'Teilweise' },
            'Bezahlt': { variant: 'success', icon: CheckCircle2, label: 'Bezahlt' }
        };
        const cfg = config[status] || config.Geplant;
        const Icon = cfg.icon;
        return (
            <Badge variant={cfg.variant} className="gap-1">
                <Icon className="w-3 h-3" />
                {cfg.label}
            </Badge>
        );
    };

    const getSourceBadge = (type) => {
        const colors = {
            'Grundsteuer': 'bg-blue-100 text-blue-700',
            'Versicherung': 'bg-purple-100 text-purple-700',
            'Kredit': 'bg-red-100 text-red-700',
            'Versorger': 'bg-green-100 text-green-700',
            'Mietvertrag': 'bg-amber-100 text-amber-700',
            'AfA': 'bg-slate-100 text-slate-700',
            'Kaufvertrag': 'bg-indigo-100 text-indigo-700'
        };
        return (
            <Badge className={colors[type] || 'bg-slate-100 text-slate-700'}>
                {type}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Generierte Buchungen</h1>
                    <p className="text-slate-500">Automatisch generierte finanzielle Buchungen</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOnboardingOpen(true)}
                        className="gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Buchungen generieren
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedBooking(null);
                            setEditorOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Manuelle Buchung
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Gesamt", value: stats.total, icon: Calendar, color: "blue" },
                    { label: "Geplant", value: stats.planned, icon: Clock, color: "yellow" },
                    { label: "Überfällig", value: stats.overdue, icon: AlertCircle, color: "red" },
                    { label: "Bezahlt", value: stats.paidAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), icon: DollarSign, color: "emerald" }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">{stat.label}</p>
                                <p className={`text-2xl font-bold text-${stat.color}-600`}>
                                    {typeof stat.value === 'number' && stat.label !== 'Bezahlt' ? stat.value : stat.value}
                                </p>
                            </div>
                            <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                        </div>
                    </CardContent>
                </Card>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="Geplant">Geplant</SelectItem>
                                <SelectItem value="Gebucht">Gebucht</SelectItem>
                                <SelectItem value="TeilweiseBezahlt">Teilweise bezahlt</SelectItem>
                                <SelectItem value="Bezahlt">Bezahlt</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Quelle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Quellen</SelectItem>
                                <SelectItem value="Grundsteuer">Grundsteuer</SelectItem>
                                <SelectItem value="Versicherung">Versicherung</SelectItem>
                                <SelectItem value="Kredit">Kredit</SelectItem>
                                <SelectItem value="Versorger">Versorger</SelectItem>
                                <SelectItem value="Mietvertrag">Mietvertrag</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                            <SelectTrigger>
                                <SelectValue placeholder="Objekt" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Objekte</SelectItem>
                                {buildings.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Bookings List */}
            <Card>
                <CardHeader>
                    <CardTitle>Buchungen ({filteredBookings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-600">Lade Buchungen...</div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 mb-4">Keine Buchungen gefunden</p>
                            <Button
                                onClick={() => setOnboardingOpen(true)}
                                variant="outline"
                                className="gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Buchungen generieren
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBookings.map(booking => {
                                const building = buildings.find(b => b.id === booking.building_id);
                                const isOverdue = new Date(booking.due_date) < new Date() && 
                                                 booking.booking_status !== 'Bezahlt';
                                
                                return (
                                    <div
                                        key={booking.id}
                                        className={`p-4 border rounded-lg hover:bg-slate-50 transition-colors ${
                                            isOverdue ? 'border-red-300 bg-red-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-medium text-slate-800">
                                                        {booking.description}
                                                    </span>
                                                    {getSourceBadge(booking.source_type)}
                                                    {getStatusBadge(booking.booking_status)}
                                                    {isOverdue && (
                                                        <Badge variant="destructive">Überfällig</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {building?.name || 'Unbekannt'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(booking.due_date).toLocaleDateString('de-DE')}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        {booking.amount.toLocaleString('de-DE', { 
                                                            style: 'currency', 
                                                            currency: 'EUR' 
                                                        })}
                                                    </div>
                                                    {booking.paid_amount > 0 && (
                                                        <span className="text-emerald-600">
                                                            (bezahlt: {booking.paid_amount.toFixed(2)} €)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setEditorOpen(true);
                                                    }}
                                                >
                                                    Bearbeiten
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (confirm('Buchung wirklich löschen?')) {
                                                            deleteMutation.mutate(booking.id);
                                                        }
                                                    }}
                                                >
                                                    Löschen
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <BookingEditorDialog
                open={editorOpen}
                onOpenChange={setEditorOpen}
                booking={selectedBooking}
                onSuccess={() => {
                    setEditorOpen(false);
                    setSelectedBooking(null);
                }}
            />

            <BookingOnboardingDialog
                open={onboardingOpen}
                onOpenChange={setOnboardingOpen}
                buildingId={selectedBuilding !== 'all' ? selectedBuilding : null}
            />
        </div>
    );
}