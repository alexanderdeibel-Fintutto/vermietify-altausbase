import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, PieChart, LineChart } from 'lucide-react';
import FinancialReportCard from '@/components/reporting/FinancialReportCard';
import OccupancyReportCard from '@/components/reporting/OccupancyReportCard';
import TenantStatisticsCard from '@/components/reporting/TenantStatisticsCard';
import ExportMenu from '@/components/reporting/ExportMenu';

export default function ReportingDashboard() {
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [activeTab, setActiveTab] = useState('financial');

    // Get buildings
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings:reporting'],
        queryFn: () => base44.entities.Building.list()
    });

    // Financial Report
    const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
        queryKey: ['report:financial', selectedBuilding],
        queryFn: () => base44.functions.invoke('generateFinancialReport', {
            building_id: selectedBuilding,
            date_from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
            date_to: new Date().toISOString().split('T')[0]
        }),
        enabled: !!selectedBuilding
    });

    // Occupancy Report
    const { data: occupancyData, isLoading: isLoadingOccupancy } = useQuery({
        queryKey: ['report:occupancy', selectedBuilding],
        queryFn: () => base44.functions.invoke('generateOccupancyReport', {
            building_id: selectedBuilding
        }),
        enabled: !!selectedBuilding
    });

    // Tenant Statistics
    const { data: tenantData, isLoading: isLoadingTenants } = useQuery({
        queryKey: ['report:tenants', selectedBuilding],
        queryFn: () => base44.functions.invoke('generateTenantStatistics', {
            building_id: selectedBuilding
        }),
        enabled: !!selectedBuilding
    });

    const selectedBuildingName = buildings.find(b => b.id === selectedBuilding)?.name || '';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reporting Dashboard</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Generieren und exportieren Sie detaillierte Reports für Ihre Gebäude.
                </p>
            </div>

            {/* Building Selection */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Gebäude auswählen</label>
                            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Gebäude wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {buildings.map(building => (
                                        <SelectItem key={building.id} value={building.id}>
                                            {building.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reports */}
            {selectedBuilding && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="financial" className="flex gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Finanzen
                        </TabsTrigger>
                        <TabsTrigger value="occupancy" className="flex gap-2">
                            <PieChart className="w-4 h-4" />
                            Auslastung
                        </TabsTrigger>
                        <TabsTrigger value="tenants" className="flex gap-2">
                            <LineChart className="w-4 h-4" />
                            Mieter
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="financial" className="space-y-4">
                        <div className="flex justify-end">
                            <ExportMenu 
                                reportData={financialData?.data}
                                reportType="financial"
                                fileName={`finanzubersicht_${selectedBuildingName}_${new Date().toISOString().split('T')[0]}`}
                            />
                        </div>
                        <FinancialReportCard 
                            data={financialData?.data} 
                            isLoading={isLoadingFinancial}
                        />
                    </TabsContent>

                    <TabsContent value="occupancy" className="space-y-4">
                        <div className="flex justify-end">
                            <ExportMenu 
                                reportData={occupancyData?.data}
                                reportType="occupancy"
                                fileName={`auslastung_${selectedBuildingName}_${new Date().toISOString().split('T')[0]}`}
                            />
                        </div>
                        <OccupancyReportCard 
                            data={occupancyData?.data}
                            isLoading={isLoadingOccupancy}
                        />
                    </TabsContent>

                    <TabsContent value="tenants" className="space-y-4">
                        <div className="flex justify-end">
                            <ExportMenu 
                                reportData={tenantData?.data}
                                reportType="tenants"
                                fileName={`mieterstatistik_${selectedBuildingName}_${new Date().toISOString().split('T')[0]}`}
                            />
                        </div>
                        <TenantStatisticsCard 
                            data={tenantData?.data}
                            isLoading={isLoadingTenants}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {!selectedBuilding && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-slate-500">Wählen Sie ein Gebäude aus, um Reports zu generieren.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}