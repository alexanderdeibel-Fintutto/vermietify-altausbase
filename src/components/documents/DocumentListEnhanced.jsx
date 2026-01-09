import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Trash2, FileText, Image as ImageIcon, FileCode, History, Pen } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import DocumentVersionHistory from './DocumentVersionHistory';
import SignatureWorkflow from './SignatureWorkflow';

const getFileIcon = (fileType) => {
  if (fileType === 'image') return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (fileType === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
  return <FileCode className="w-4 h-4 text-slate-500" />;
};

const statusLabels = {
  zu_erledigen: '⏳ Zu erledigen',
  erinnern: '⏰ Erinnern',
  erstellt: '✅ Erstellt',
  geaendert: '✏️ Geändert',
  versendet: '📤 Versendet',
  unterschrieben: '✍️ Unterschrieben',
  gescannt: '📸 Gescannt'
};

const statusColors = {
  zu_erledigen: 'bg-yellow-100 text-yellow-700',
  erinnern: 'bg-orange-100 text-orange-700',
  erstellt: 'bg-green-100 text-green-700',
  geaendert: 'bg-blue-100 text-blue-700',
  versendet: 'bg-purple-100 text-purple-700',
  unterschrieben: 'bg-green-200 text-green-800',
  gescannt: 'bg-slate-100 text-slate-700'
};

const categoryColors = {
  'Mietrecht': 'bg-red-100 text-red-700',
  'Verwaltung': 'bg-blue-100 text-blue-700',
  'Finanzen': 'bg-green-100 text-green-700',
  'Sonstiges': 'bg-slate-100 text-slate-700'
};

export default function DocumentListEnhanced({ documents = [], onDelete, isLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState(null);
  const [signatureWorkflowDoc, setSignatureWorkflowDoc] = useState(null);

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchQuery || 
        doc.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || doc.category === filterCategory;
      const matchesStatus = !filterStatus || doc.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchQuery, filterCategory, filterStatus]);

  const categories = [...new Set(documents.map(d => d.category))];
  const statuses = [...new Set(documents.map(d => d.status))];

  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Dokumente vorhanden</p>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <Input
              placeholder="Dokument durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-light"
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Kategorien</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Status</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Documents */}
      <div className="space-y-2">
        {filtered.map(doc => (
          <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 flex gap-3">
                <div className="mt-1">
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-light text-slate-900">{doc.name}</h4>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={categoryColors[doc.category] || categoryColors['Sonstiges']}>
                      {doc.category}
                    </Badge>
                    <Badge className={statusColors[doc.status]}>
                      {statusLabels[doc.status]}
                    </Badge>
                  </div>

                  {doc.entity_references?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.entity_references.map((ref, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          {ref.entity_name}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 font-light mt-2">
                    {format(new Date(doc.created_date), 'd. MMM yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {doc.file_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewDoc(doc)}
                    title="Vorschau"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVersionHistoryDoc(doc)}
                  title="Versionsverlauf"
                  className="text-blue-400 hover:text-blue-600"
                >
                  <History className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSignatureWorkflowDoc(doc)}
                  title="Signatur-Workflow"
                  className="text-purple-400 hover:text-purple-600"
                >
                  <Pen className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete?.(doc.id)}
                  title="Löschen"
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {previewDoc && (
        <DocumentPreviewDialog
          open={!!previewDoc}
          onOpenChange={() => setPreviewDoc(null)}
          document={previewDoc}
        />
      )}

      {versionHistoryDoc && (
        <DocumentVersionHistory
          documentId={versionHistoryDoc.id}
          onClose={() => setVersionHistoryDoc(null)}
        />
      )}

      {signatureWorkflowDoc && (
        <SignatureWorkflow
          documentId={signatureWorkflowDoc.id}
          onClose={() => setSignatureWorkflowDoc(null)}
        />
      )}
    </>
  );
}