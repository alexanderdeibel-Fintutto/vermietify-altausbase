import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Calendar, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VacancyManagement() {
    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.LeaseContract.list()
    });

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => base44.entities.Unit.list()
    });

    const upcomingVacancies = contracts
        .filter(c => new Date(c.mietende) > new Date())
        .filter(c => {
            const daysUntil = (new Date(c.mietende) - new Date()) / (24*60*60*1000);
            return daysUntil <= 90 && daysUntil > 0;
        })
        .sort((a, b) => new Date(a.mietende) - new Date(b.mietende));

    const occupancyRate = units.length > 0 ? (contracts.length / units.length * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Leerstandsverwaltung</h1>
                    <p className="vf-page-subtitle">Ausstattungen & Übergaben</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Home className="w-8