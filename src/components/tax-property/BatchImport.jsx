import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function BatchImport() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const response = await base44.functions.invoke('importAssetPortfolioCSV', {
        file_url,
        auto_categorize: true
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success(`${data.imported} Einträge importiert`);
      setUploading(false);
    }
  });

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) importMutation.mutate(file);
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Batch-Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleImport}
          disabled={uploading}
          className="w-full h-20 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8" />
            <span className="font-semibold">{uploading ? 'Importiere...' : 'CSV/Excel importieren'}</span>
          </div>
        </Button>

        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-semibold mb-2">Unterstützte Formate:</p>
          <ul className="space-y-1 text-xs text-slate-600">
            <li>• Depot-Auszüge (CSV)</li>
            <li>• Kontoauszüge (CSV/Excel)</li>
            <li>• Transaktionslisten</li>
            <li>• Immobilien-Daten</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}