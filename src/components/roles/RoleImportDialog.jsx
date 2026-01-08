import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('merge');
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      const response = await base44.functions.invoke('importRoles', {
        importData,
        mode
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Import erfolgreich');
    }
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        toast.error('Bitte wählen Sie eine JSON-Datei');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rollen & Permissions importieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">JSON-Datei</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full mt-2 text-sm"
            />
            {file && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                <CheckCircle2 className="w-4 h-4 inline text-green-600 mr-2" />
                {file.name}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Import-Modus</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Merge (nur neue hinzufügen)</SelectItem>
                <SelectItem value="overwrite">Overwrite (bestehende überschreiben)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => importMutation.mutate()}
            disabled={!file || importMutation.isPending}
            className="w-full"
          >
            {importMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importiere...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Importieren</>
            )}
          </Button>

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Import erfolgreich
              </div>
              <div className="text-sm space-y-1">
                <div>Rollen erstellt: {result.stats?.rolesCreated || 0}</div>
                <div>Rollen aktualisiert: {result.stats?.rolesUpdated || 0}</div>
                <div>Permissions erstellt: {result.stats?.permissionsCreated || 0}</div>
                {result.stats?.errors?.length > 0 && (
                  <div className="mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {result.stats.errors.length} Fehler
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}