import React from 'react';
import { Card } from "@/components/ui/card";
import { FileText, BookOpen, Calculator, TrendingUp } from 'lucide-react';

export default function TaxOverview() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Steuer Übersicht</h1>
                <p className="text-slate-600 mt-2">Überblick über alle steuerrelevanten Daten</p>
            </div>

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
        </div>
    );
}