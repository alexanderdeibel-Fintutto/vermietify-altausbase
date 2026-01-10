import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tag, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentTagManager({ documentId }) {
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ id: documentId });
      return docs[0];
    },
    enabled: !!documentId
  });

  const addTagMutation = useMutation({
    mutationFn: async (tag) => {
      const currentTags = document?.ai_tags || [];
      return await base44.entities.Document.update(documentId, {
        ai_tags: [...currentTags, tag]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success('Tag hinzugefügt');
      setNewTag('');
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tag) => {
      const currentTags = document?.ai_tags || [];
      return await base44.entities.Document.update(documentId, {
        ai_tags: currentTags.filter(t => t !== tag)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success('Tag entfernt');
    }
  });

  const tags = document?.ai_tags || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Neuer Tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && newTag && addTagMutation.mutate(newTag)}
          />
          <Button
            size="icon"
            onClick={() => newTag && addTagMutation.mutate(newTag)}
            disabled={!newTag}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag} className="gap-1">
              {tag}
              <button onClick={() => removeTagMutation.mutate(tag)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}