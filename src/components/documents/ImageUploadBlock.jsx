import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Maximize2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ImageUploadBlock({ block, onUpdate, onDelete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdate({ ...block, imageUrl: file_url });
    } catch (err) {
      setError('Fehler beim Upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-2">Bild-URL</label>
        <Input
          value={block.imageUrl || ''}
          onChange={(e) => onUpdate({ ...block, imageUrl: e.target.value })}
          placeholder="https://..."
          className="text-xs h-8"
        />
        <p className="text-xs text-slate-500 mt-1">oder Bild hochladen:</p>
        <label className="block mt-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs cursor-pointer"
            disabled={uploading}
          >
            <span>
              <Upload className="w-3 h-3 mr-1" />
              {uploading ? 'Lädt...' : 'Datei auswählen'}
            </span>
          </Button>
        </label>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {block.imageUrl && (
        <>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">Breite (px)</label>
            <Input
              type="number"
              value={block.width || 300}
              onChange={(e) => onUpdate({ ...block, width: parseInt(e.target.value) })}
              className="text-xs h-8"
              min="50"
              max="600"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">Höhe (px)</label>
            <Input
              type="number"
              value={block.height || 200}
              onChange={(e) => onUpdate({ ...block, height: parseInt(e.target.value) })}
              className="text-xs h-8"
              min="50"
              max="600"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">Ausrichtung</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(align => (
                <Button
                  key={align}
                  variant={block.align === align ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs flex-1"
                  onClick={() => onUpdate({ ...block, align })}
                >
                  {align === 'left' ? 'Links' : align === 'center' ? 'Mitte' : 'Rechts'}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">Alt-Text (Barrierefreiheit)</label>
            <Input
              value={block.altText || ''}
              onChange={(e) => onUpdate({ ...block, altText: e.target.value })}
              placeholder="Bildbeschreibung..."
              className="text-xs h-8"
            />
          </div>

          <Button
            onClick={() => onDelete()}
            variant="destructive"
            size="sm"
            className="w-full h-8 text-xs"
          >
            <X className="w-3 h-3 mr-1" /> Bild löschen
          </Button>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-slate-50 border">
            <img
              src={block.imageUrl}
              alt={block.altText || 'Vorschau'}
              style={{
                width: block.width,
                height: block.height,
                objectFit: 'cover',
                marginLeft: block.align === 'center' ? 'auto' : undefined,
                marginRight: block.align === 'center' ? 'auto' : undefined,
                marginBottom: block.align === 'center' ? 'auto' : undefined,
                display: block.align === 'center' ? 'block' : 'inline'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}