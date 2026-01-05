import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Layout as LayoutIcon, Puzzle, ScanLine } from 'lucide-react';
import DocumentsList from '@/components/documents/DocumentsList';
import TemplatesList from '@/components/documents/TemplatesList';
import TextBlocksList from '@/components/documents/TextBlocksList';
import OriginalsList from '@/components/documents/OriginalsList';

export default function Documents() {
    const [activeTab, setActiveTab] = useState('documents');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Dokumentenverwaltung</h1>
                <p className="text-slate-600 mt-1">Verwalten Sie Dokumente, Vorlagen, Textbausteine und Originale</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                    <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
                        <FileText className="w-4 h-4" />
                        <span>Dokumente</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2 py-3">
                        <LayoutIcon className="w-4 h-4" />
                        <span>Vorlagen</span>
                    </TabsTrigger>
                    <TabsTrigger value="textblocks" className="flex items-center gap-2 py-3">
                        <Puzzle className="w-4 h-4" />
                        <span>Textbausteine</span>
                    </TabsTrigger>
                    <TabsTrigger value="originals" className="flex items-center gap-2 py-3">
                        <ScanLine className="w-4 h-4" />
                        <span>Originale</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="mt-6">
                    <DocumentsList />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <TemplatesList />
                </TabsContent>

                <TabsContent value="textblocks" className="mt-6">
                    <TextBlocksList />
                </TabsContent>

                <TabsContent value="originals" className="mt-6">
                    <OriginalsList />
                </TabsContent>
            </Tabs>
        </div>
    );
}