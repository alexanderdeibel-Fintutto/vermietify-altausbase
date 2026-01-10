import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentFilterBar from '@/components/documents/DocumentFilterBar';
import DocumentTable from '@/components/documents/DocumentTable';
import QuickStats from '@/components/shared/QuickStats';
import AIDocumentGenerator from '@/components/documents/AIDocumentGenerator';
import { Wand2 } from 'lucide-react';

export default function DocumentManagementPage() {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document?.list?.() || []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
  });

  const filteredDocuments = documents.filter(d => (d.name || '').toLowerCase().includes(search.toLowerCase()));
  const totalSize = documents.reduce((sum, d) => sum + (d.size || 0), 0);

  const stats = [
    { label: 'Gesamt-Dokumente', value: documents.length },
    { label: 'Speicher-Nutzung', value: `${(totalSize / 1024 / 1024).toFixed(1)} MB` },
    { label: 'Diese Woche', value: 0 },
    { label: 'Diese Monat', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📄 Dokumente</h1>
        <p className="text-slate-600 mt-1">Verwalten und organisieren Sie Ihre Dokumente</p>
      </div>
      <QuickStats stats={stats} accentColor="indigo" />
      
      <div className="flex gap-3">
        <Button
          onClick={() => setShowAIGenerator(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          KI-Dokument generieren
        </Button>
      </div>

      <DocumentFilterBar onSearchChange={setSearch} onNewDocument={() => setShowDialog(true)} />
      <DocumentTable documents={filteredDocuments} onDownload={() => {}} onDelete={(d) => deleteMutation.mutate(d.id)} />
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dokument hochladen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <input type="file" className="w-full" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">Hochladen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIDocumentGenerator
        open={showAIGenerator}
        onClose={() => {
          setShowAIGenerator(false);
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }}
      />
    </div>
  );
}