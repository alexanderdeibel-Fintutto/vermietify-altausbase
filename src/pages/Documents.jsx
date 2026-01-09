import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileCode, Type, FolderOpen, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DocumentsList from '../components/documents/DocumentsList';
import DocumentListEnhanced from '../components/documents/DocumentListEnhanced';
import DocumentUploadDialog from '../components/documents/DocumentUploadDialog';
import TemplatesList from '../components/documents/TemplatesList';
import TextBlocksList from '../components/documents/TextBlocksList';
import OriginalsList from '../components/documents/OriginalsList';
import PDFTemplateImporter from '../components/documents/PDFTemplateImporter';
import ModuleGuard from '@/components/package/ModuleGuard';

export default function DocumentsPage() {
    const [importerOpen, setImporterOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch data for upload dialog
    const { data: documents = [] } = useQuery({
      queryKey: ['documents'],
      queryFn: () => base44.entities.Document.list('-created_date', 200),
    });

    const { data: buildings = [] } = useQuery({
      queryKey: ['buildings'],
      queryFn: () => base44.entities.Building.list('-updated_date', 50),
    });

    const { data: tenants = [] } = useQuery({
      queryKey: ['tenants'],
      queryFn: () => base44.entities.Tenant.list('-updated_date', 100),
    });

    const { data: contracts = [] } = useQuery({
      queryKey: ['contracts'],
      queryFn: () => base44.entities.LeaseContract.list('-updated_date', 100),
    });

    const { data: equipment = [] } = useQuery({
      queryKey: ['equipment'],
      queryFn: () => base44.entities.Equipment.list('-updated_date', 100),
    });

    const deleteMutation = useMutation({
      mutationFn: (docId) => base44.entities.Document.delete(docId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      },
    });
    
    return (
        <ModuleGuard moduleName="dokumentation">
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Dokumente</h1>
                    <p className="text-sm font-extralight text-slate-400 mt-1">Verwalten Sie Dokumente, Vorlagen und Textbausteine</p>
                </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
            <Tabs defaultValue="documents" className="w-full">
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={() => setUploadOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 font-light gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Dokument hochladen
                    </Button>
                </div>
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
                    <DocumentListEnhanced 
                        documents={documents}
                        onDelete={(docId) => deleteMutation.mutate(docId)}
                    />
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

                <DocumentUploadDialog
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    buildings={buildings}
                    tenants={tenants}
                    contracts={contracts}
                    equipment={equipment}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['documents'] });
                    }}
                />
                </div>
                </ModuleGuard>
                );
                }