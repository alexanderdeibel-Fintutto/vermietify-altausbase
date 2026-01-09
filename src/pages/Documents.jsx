import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileCode, Type, FolderOpen, Sparkles } from 'lucide-react';
import DocumentsList from '../components/documents/DocumentsList';
import TemplatesList from '../components/documents/TemplatesList';
import TextBlocksList from '../components/documents/TextBlocksList';
import OriginalsList from '../components/documents/OriginalsList';
import PDFTemplateImporter from '../components/documents/PDFTemplateImporter';
import ModuleGuard from '@/components/package/ModuleGuard';

export default function DocumentsPage() {
    const [importerOpen, setImporterOpen] = useState(false);
    
    return (
        <ModuleGuard moduleName="dokumentation">
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-medium text-slate-800">Dokumente</h1>
                    <p className="text-slate-600">Verwalten Sie Dokumente, Vorlagen und Textbausteine</p>
                </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="documents">
                        <FileText className="w-4 h-4 mr-2" />
                        Dokumente
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileCode className="w-4 h-4 mr-2" />
                        Vorlagen
                    </TabsTrigger>
                    <TabsTrigger value="textblocks">
                        <Type className="w-4 h-4 mr-2" />
                        Textbausteine
                    </TabsTrigger>
                    <TabsTrigger value="originals">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Originale
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="mt-6">
                    <DocumentsList />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={() => setImporterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Aus PDF importieren
                        </button>
                    </div>
                    <TemplatesList />
                    <PDFTemplateImporter open={importerOpen} onOpenChange={setImporterOpen} />
                </TabsContent>

                <TabsContent value="textblocks" className="mt-6">
                    <TextBlocksList />
                </TabsContent>

                <TabsContent value="originals" className="mt-6">
                    <OriginalsList />
                </TabsContent>
                </Tabs>
                </motion.div>
                </div>
                </ModuleGuard>
                );
                }