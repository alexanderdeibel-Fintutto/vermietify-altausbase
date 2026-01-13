import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const defaultColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#FFD700', '#FF8C00'];

export default function DocumentTagManager({ documentId }) {
  const [newTag, setNewTag] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const queryClient = useQueryClient();

  const { data: tags = [] } = useQuery({
    queryKey: ['document-tags', documentId],
    queryFn: () => base44.entities.DocumentTag?.filter?.({
      document_id: documentId
    }) || []
  });

  const addTagMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.DocumentTag.create({
        document_id: documentId,
        name: newTag,
        color: selectedColor
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-tags', documentId] });
      setNewTag('');
      setSelectedColor(defaultColors[0]);
      toast.success('Tag hinzugefügt');
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId) => {
      return await base44.entities.DocumentTag.delete(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-tags', documentId] });
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {tags.map(tag => (
          <Badge
            key={tag.id}
            className="gap-1.5 px-3 py-1.5 text-white cursor-pointer hover:opacity-80 transition"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => removeTagMutation.mutate(tag.id)}
              className="hover:brightness-125"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') addTagMutation.mutate();
          }}
          placeholder="Neues Tag..."
          className="text-sm"
        />
        <div className="flex gap-1 border rounded-lg p-1 bg-slate-50">
          {defaultColors.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded border-2 transition ${
                selectedColor === color ? 'border-slate-400' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => addTagMutation.mutate()}
          disabled={!newTag.trim() || addTagMutation.isPending}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Tag
        </Button>
      </div>
    </div>
  );
}