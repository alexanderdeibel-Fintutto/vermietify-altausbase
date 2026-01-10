import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function SaveAsTemplateDialog({ 
  open, 
  onOpenChange, 
  workflowId, 
  companyId,
  workflowName 
}) {
  const [name, setName] = useState(workflowName || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isPublic, setIsPublic] = useState(false);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('saveWorkflowAsTemplate', {
        company_id: companyId,
        workflow_id: workflowId,
        template_name: name,
        template_description: description,
        category,
        tags,
        difficulty,
        is_public: isPublic
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-templates'] });
      onOpenChange(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setName(workflowName || '');
    setDescription('');
    setCategory('');
    setTags([]);
    setTagInput('');
    setDifficulty('intermediate');
    setIsPublic(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Als Template speichern</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Template-Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Beschreibung</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 h-16"
              placeholder="Erklären Sie, wofür dieses Template verwendet wird..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium">Kategorie</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1"
              placeholder="z.B. approval, automation"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-1 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Tag eingeben..."
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addTag}
              >
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium">Schwierigkeitsstufe</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Anfänger</SelectItem>
                <SelectItem value="intermediate">Mittel</SelectItem>
                <SelectItem value="advanced">Fortgeschrittene</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Public Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="public" className="text-sm">
              Mit Team teilen
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name || saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}