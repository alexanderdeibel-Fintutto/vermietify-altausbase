import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Building2, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import TaxLibraryInstallDialog from '@/components/tax-library/TaxLibraryInstallDialog';
import TaxLibraryOverview from '@/components/tax-library/TaxLibraryOverview';
import CustomCategoryManager from '@/components/tax-library/CustomCategoryManager';

export default function TaxLibraryManagement() {
    const [selectedBuildingId, setSelectedBuildingId] = useState(null);
    const [installDialogOpen, setInstallDialogOpen] = useState(false);

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const { data: taxLibraries = [] } = useQuery({
        queryKey: ['taxLibraries'],
        queryFn: () => base44.entities.BuildingTaxLibrary.list()
    });

    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
    const selectedLibrary = taxLibraries.find(lib => lib.building_id === selectedBuildingId);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Steuerbibliothek</h1>
                <p className="text-slate-600">Verwalten Sie steuerliche Kategorien und Kontenzuordnungen pro Gebäude</p>
            </div>

            {/* Buildings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildings.map(building => {
                    const library = taxLibraries.find(lib => lib.building_id === building.id);
                    
                    return (
                        <Card 
                            key={building.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                                selectedBuildingId === building.id ? 'ring-2 ring-emerald-500' : ''
                            }`}
                            onClick={() => setSelectedBuildingId(building.id)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-emerald-600" />
                                        <span className="text-lg">{building.name}</span>
                                    </div>
                                    {library ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-sm text-slate-600">
                                        {building.address}, {building.city}
                                    </div>
                                    {library ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-emerald-100 text-emerald-700">
                                                    Installiert
                                                </Badge>
                                                <Badge variant="outline">{library.legal_form}</Badge>
                                                <Badge variant="outline">{library.account_framework}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {library.cost_categories?.length || 0} Kategorien verfügbar
                                            </p>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBuildingId(building.id);
                                                setInstallDialogOpen(true);
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="w-full mt-2"
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Bibliothek installieren
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {buildings.length === 0 && (
                    <Card className="col-span-full p-12 text-center">
                        <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Gebäude</h3>
                        <p className="text-slate-600">Erstellen Sie zuerst Gebäude in der Objektverwaltung</p>
                    </Card>
                )}
            </div>

            {/* Selected Building Details */}
            {selectedBuildingId && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">
                            {selectedBuilding?.name}
                        </h2>
                        {selectedLibrary && (
                            <Button
                                variant="outline"
                                onClick={() => setInstallDialogOpen(true)}
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Neu installieren
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="overview">
                        <TabsList>
                            <TabsTrigger value="overview" className="gap-2">
                                <BookOpen className="w-4 h-4" />
                                Bibliothek
                            </TabsTrigger>
                            <TabsTrigger value="custom" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Eigene Kategorien
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-6">
                            <TaxLibraryOverview buildingId={selectedBuildingId} />
                        </TabsContent>

                        <TabsContent value="custom" className="mt-6">
                            <CustomCategoryManager buildingId={selectedBuildingId} />
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Install Dialog */}
            {selectedBuilding && (
                <TaxLibraryInstallDialog
                    building={selectedBuilding}
                    open={installDialogOpen}
                    onOpenChange={setInstallDialogOpen}
                />
            )}
        </div>
    );
}