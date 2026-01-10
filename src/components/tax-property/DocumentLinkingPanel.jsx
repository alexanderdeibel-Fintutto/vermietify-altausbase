import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link as LinkIcon, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentLinkingPanel({ documentId }) {
  const [entityType, setEntityType] = useState('building');
  const [entityId, setEntityId] = useState('');
  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list(null, 100)
  });

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ id: documentId });
      return docs[0];
    },
    enabled: !!documentId
  });

  const linkMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      const updates = {
        [`${type}_id`]: id
      };

      const entity = type === 'building' 
        ? buildings.find(b => b.id === id)
        : contracts.find(c => c.id === id);

      const currentRefs = document?.entity_references || [];
      updates.entity_references = [
        ...currentRefs,
        {
          entity_type: type,
          entity_id: id,
          entity_name: entity?.name || entity?.building_id || 'Unknown'
        }
      ];

      return await base44.entities.Document.update(documentId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success('Verknüpfung erstellt');
    }
  });

  const linkedEntities = document?.entity_references || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Verknüpfungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="building">Gebäude</SelectItem>
              <SelectItem value="contract">Vertrag</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {(entityType === 'building' ? buildings : contracts).map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name || item.building_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="icon"
            onClick={() => linkMutation.mutate({ type: entityType, id: entityId })}
            disabled={!entityId}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>

        {linkedEntities.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold">Verknüpft mit:</p>
            {linkedEntities.map((ref, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span className="text-sm">{ref.entity_name}</span>
                <Badge variant="outline" className="text-xs">{ref.entity_type}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}