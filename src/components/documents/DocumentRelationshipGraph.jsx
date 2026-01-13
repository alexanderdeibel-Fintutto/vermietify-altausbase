import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentRelationshipGraph({ documentId, allDocuments = [] }) {
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [relationType, setRelationType] = useState('related');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: relationships = [] } = useQuery({
    queryKey: ['document-relationships', documentId],
    queryFn: () => base44.entities.DocumentRelationship?.filter?.({
      source_document_id: documentId
    }) || []
  });

  const addRelationshipMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.DocumentRelationship.create({
        source_document_id: documentId,
        target_document_id: selectedTargetId,
        relationship_type: relationType,
        description: description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-relationships', documentId] });
      setSelectedTargetId('');
      setDescription('');
      setRelationType('related');
      toast.success('Beziehung hinzugefügt');
    }
  });

  const removeRelationshipMutation = useMutation({
    mutationFn: async (relationshipId) => {
      return await base44.entities.DocumentRelationship.delete(relationshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-relationships', documentId] });
      toast.success('Beziehung entfernt');
    }
  });

  const getDocumentTitle = (docId) => {
    return allDocuments.find(d => d.id === docId)?.title || docId;
  };

  const typeLabels = {
    related: 'Verwandt',
    parent: 'Übergeordnet',
    child: 'Untergeordnet',
    reference: 'Referenz',
    attachment: 'Anlage'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dokumentbeziehungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Relationship */}
        <div className="space-y-3 p-3 border rounded-lg bg-slate-50">
          <div className="flex gap-2">
            <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Dokument wählen..." />
              </SelectTrigger>
              <SelectContent>
                {allDocuments
                  .filter(d => d.id !== documentId)
                  .map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select value={relationType} onValueChange={setRelationType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => addRelationshipMutation.mutate()}
              disabled={!selectedTargetId || addRelationshipMutation.isPending}
              className="gap-1"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </Button>
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            className="text-sm"
          />
        </div>

        {/* Relationships List */}
        <div className="space-y-2">
          {relationships.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Keine Beziehungen</p>
          ) : (
            relationships.map(rel => (
              <div key={rel.id} className="p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-700 truncate max-w-xs">
                    {getDocumentTitle(rel.target_document_id)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {typeLabels[rel.relationship_type]}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-red-600 hover:text-red-700 h-7 w-7 p-0"
                    onClick={() => removeRelationshipMutation.mutate(rel.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {rel.description && (
                  <p className="text-xs text-slate-500">{rel.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}