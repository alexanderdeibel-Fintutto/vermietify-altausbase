import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Trash2 } from 'lucide-react';

export default function CustomMetadataManager({ companyId }) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const queryClient = useQueryClient();

  const { data: fields = [] } = useQuery({
    queryKey: ['custom-fields', companyId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.CustomMetadataField.filter({ company_id: companyId });
      return result;
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.CustomMetadataField.create({
        company_id: companyId,
        name: fieldName,
        label: fieldName,
        field_type: fieldType
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setFieldName('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.CustomMetadataField.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Custom Metadata Felder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Feldname"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="text-sm flex-1"
          />
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="p-2 border rounded text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Zahl</option>
            <option value="date">Datum</option>
            <option value="select">Auswahl</option>
            <option value="boolean">Ja/Nein</option>
          </select>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!fieldName || createMutation.isPending}
            size="sm"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-1">
          {fields.map(field => (
            <div key={field.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="text-sm font-medium">{field.label}</p>
                <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(field.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}