import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Eye } from 'lucide-react';

export default function VisualTemplateBuilder({ companyId }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.DocumentTemplate.create({
        company_id: companyId,
        name,
        category,
        content,
        fields,
        version: 1,
        is_public: false
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      resetForm();
    }
  });

  const resetForm = () => {
    setName('');
    setCategory('');
    setContent('');
    setFields([]);
  };

  const addField = () => {
    if (fieldName.trim()) {
      setFields([...fields, { name: fieldName, type: fieldType }]);
      setFieldName('');
      setFieldType('text');
    }
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dokumententemplate erstellen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Template-Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Kategorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          {/* Content Editor */}
          <div>
            <label className="text-sm font-medium">Inhalt</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Template-Inhalt (HTML/Markdown)..."
              className="h-32 mt-1"
            />
          </div>

          {/* Field Management */}
          <div>
            <label className="text-sm font-medium">Dynamische Felder</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Feldname"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="flex-1"
              />
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
                className="px-2 border rounded text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Zahl</option>
                <option value="date">Datum</option>
                <option value="select">Auswahl</option>
              </select>
              <Button size="sm" variant="outline" onClick={addField}>
                +
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {fields.map((f, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeField(i)}
                  >
                    {f.name} ({f.type}) <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setPreview(!preview)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Vorschau
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name || !content || createMutation.isPending}
              className="flex-1"
            >
              Erstellen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm">Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border" dangerouslySetInnerHTML={{ __html: content }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}