import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Plus } from 'lucide-react';

export default function TaxDeclarations() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Steuererklärungen</h1>
                    <p className="text-slate-600 mt-2">Verwaltung von Steuererklärungen</p>
                </div>
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
        </div>
    );
}