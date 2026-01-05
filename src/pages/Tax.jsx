import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Calculator, TrendingUp, FileCheck, Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TaxLibraryManagement from './TaxLibraryManagement';

export default function Tax() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Steuer"
                subtitle="Verwaltung aller steuerrelevanten Daten"
            />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border border-slate-200">
                    <TabsTrigger value="overview">Übersicht</TabsTrigger>
                    <TabsTrigger value="forms">Formulare</TabsTrigger>
                    <TabsTrigger value="declarations">Erklärungen</TabsTrigger>
                    <TabsTrigger value="library">Bibliothek</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Calculator className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Laufendes Jahr</p>
                                    <p className="text-2xl font-bold text-slate-800">2026</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Erklärungen</p>
                                    <p className="text-2xl font-bold text-slate-800">0</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Formulare</p>
                                    <p className="text-2xl font-bold text-slate-800">0</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Kategorien</p>
                                    <p className="text-2xl font-bold text-slate-800">0</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Kommende Fristen</h3>
                        <div className="text-center py-8 text-slate-500">
                            Keine anstehenden Steuerfristen
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Letzte Aktivitäten</h3>
                        <div className="text-center py-8 text-slate-500">
                            Keine Aktivitäten vorhanden
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="forms" className="space-y-6">
                    <div className="flex justify-end mb-4">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Neues Formular
                        </Button>
                    </div>

                    <Card className="p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Formulare</h3>
                            <p className="text-slate-600 mb-6">Erstellen Sie Ihr erstes Steuerformular</p>
                            <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Formular erstellen
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="declarations" className="space-y-6">
                    <div className="flex justify-end mb-4">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Neue Erklärung
                        </Button>
                    </div>

                    <Card className="p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileCheck className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Keine Steuererklärungen vorhanden</h3>
                            <p className="text-slate-600 mb-6">Erstellen Sie Ihre erste Steuererklärung</p>
                            <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Erklärung erstellen
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="library">
                    <TaxLibraryManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}