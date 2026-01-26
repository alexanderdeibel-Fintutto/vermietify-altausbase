import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

const DOCUMENT_TYPES = {
  mietvertrag: 'Mietvertrag',
  nebenkostenabrechnung: 'NK-Abrechnung',
  kuendigung: 'Kündigungsschreiben',
  uebergabeprotokoll: 'Übergabeprotokoll',
  mahnung: 'Mahnschreiben',
  rechnung: 'Rechnung',
  versicherung: 'Versicherungspolice',
  grundriss: 'Grundriss',
  zaehlerstand: 'Zählerstand',
  sonstiges: 'Sonstiges'
};

export default function DocumentUploadDialog({ building, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('sonstiges');

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await base44.functions.invoke('uploadDocument', formData);
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    uploadMutation.mutate({
      file,
      title: title || file.name,
      document_type: docType,
      building_id: building.id
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Dokument hochladen</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Datei</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm">
                  {file ? file.name : 'Datei auswählen oder hierher ziehen'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Titel</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Mietvertrag Familie Müller"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dokumenttyp</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploadMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!file || !title || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}