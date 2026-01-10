import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function UniversalImporter() {
  const [entityType, setEntityType] = useState('Building');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('universalImport', { 
        file_url, 
        entity_type: entityType 
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast.success(`${data.imported} Datensätze importiert`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Universal-Importer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Building">Gebäude</SelectItem>
            <SelectItem value="Tenant">Mieter</SelectItem>
            <SelectItem value="FinancialItem">Finanzen</SelectItem>
            <SelectItem value="Document">Dokumente</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="file"
          accept=".csv,.xlsx,.json"
          onChange={(e) => e.target.files?.[0] && importMutation.mutate(e.target.files[0])}
          className="hidden"
          id="universal-import"
        />
        <label htmlFor="universal-import">
          <Button asChild className="w-full">
            <span>
              <Upload className="w-4 h-4 mr-2" />
              CSV/Excel/JSON importieren
            </span>
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}