import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Copy, Droplet, Palette, Ruler } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateBlockEditor({
  block,
  isSelected,
  onUpdate,
  onDelete,
  showInspector = false
}) {
  const [localBlock, setLocalBlock] = useState(block);

  const handleChange = (field, value) => {
    const updated = { ...localBlock, [field]: value };
    setLocalBlock(updated);
    onUpdate(updated);
  };

  const renderBlockPreview = () => {
    switch (block.type) {
      case 'heading':
        return <h2 className="text-xl font-bold text-slate-900">{block.content || 'Überschrift'}</h2>;
      case 'text':
        return <p className="text-sm text-slate-700">{block.content || 'Text eingeben...'}</p>;
      case 'table':
        return (
          <div className="text-xs border rounded overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="p-2 bg-slate-100">Spalte 1</td>
                  <td className="p-2 bg-slate-100">Spalte 2</td>
                </tr>
                <tr>
                  <td className="p-2 border-r">Daten</td>
                  <td className="p-2">Daten</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'image':
        return (
          <div className="w-full h-20 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-500">
            [Bild/Logo]
          </div>
        );
      case 'divider':
        return <hr className="border-t-2 border-slate-300" />;
      case 'signature':
        return (
          <div className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Unterschrift</p>
            <div className="w-32 h-12 border-b-2 border-slate-400"></div>
          </div>
        );
      case 'spacer':
        return <div className="h-8 bg-slate-100 rounded text-center text-xs text-slate-400">Abstand</div>;
      default:
        return <p className="text-slate-600">{block.type}</p>;
    }
  };

  if (showInspector) {
    return (
      <div className="space-y-4 bg-slate-50 rounded-lg p-4 border">
        <h4 className="font-medium text-sm text-slate-900">Block: {block.type}</h4>

        {['text', 'heading'].includes(block.type) && (
          <div>
            <label className="text-xs font-medium text-slate-700">Content</label>
            <Textarea
              value={localBlock.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>
        )}

        {block.type === 'heading' && (
          <div>
            <label className="text-xs font-medium text-slate-700">Größe</label>
            <Select value={localBlock.size || 'h2'} onValueChange={(v) => handleChange('size', v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1 (Groß)</SelectItem>
                <SelectItem value="h2">H2 (Mittel)</SelectItem>
                <SelectItem value="h3">H3 (Klein)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {block.type === 'image' && (
          <div>
            <label className="text-xs font-medium text-slate-700">Bild-URL</label>
            <Input
              value={localBlock.src || ''}
              onChange={(e) => handleChange('src', e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-slate-700">Breite</label>
          <Select value={localBlock.width || 'full'} onValueChange={(v) => handleChange('width', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">100%</SelectItem>
              <SelectItem value="1/2">50%</SelectItem>
              <SelectItem value="1/3">33%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="flex-1 h-8 text-xs"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success('Block dupliziert')}
            className="flex-1 h-8 text-xs"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {renderBlockPreview()}
    </div>
  );
}