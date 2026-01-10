import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function UniversalImporter() {
  const [importType, setImportType] = useState('transactions');

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('universalImport', {
        file_url,
        import_type: importType
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.imported} Einträge importiert`);
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
        <Select value={importType} onValueChange={setImportType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transactions">Transaktionen</SelectItem>
            <SelectItem value="buildings">Gebäude</SelectItem>
            <SelectItem value="contracts">Verträge</SelectItem>
            <SelectItem value="documents">Dokumente</SelectItem>
          </SelectContent>
        </Select>
        
        <input
          type="file"
          accept=".csv,.xlsx,.pdf"
          onChange={(e) => e.target.files?.[0] && importMutation.mutate(e.target.files[0])}
          className="hidden"
          id="universal-import"
        />
        <label htmlFor="universal-import">
          <Button asChild className="w-full">
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Datei hochladen
            </span>
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}