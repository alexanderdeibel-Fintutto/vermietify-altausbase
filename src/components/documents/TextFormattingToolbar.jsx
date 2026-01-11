import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Type
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TextFormattingToolbar({ formatting, onChange }) {
  const toggleBold = () => onChange({ ...formatting, bold: !formatting.bold });
  const toggleItalic = () => onChange({ ...formatting, italic: !formatting.italic });
  const toggleUnderline = () => onChange({ ...formatting, underline: !formatting.underline });

  return (
    <div className="space-y-3">
      {/* Font Size */}
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Schriftgröße</label>
        <Select value={String(formatting.fontSize || 16)} onValueChange={(v) => onChange({ ...formatting, fontSize: parseInt(v) })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12px</SelectItem>
            <SelectItem value="14">14px</SelectItem>
            <SelectItem value="16">16px</SelectItem>
            <SelectItem value="18">18px</SelectItem>
            <SelectItem value="20">20px</SelectItem>
            <SelectItem value="24">24px</SelectItem>
            <SelectItem value="32">32px</SelectItem>
            <SelectItem value="48">48px</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Font Family */}
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Schriftart</label>
        <Select value={formatting.fontFamily || 'Arial'} onValueChange={(v) => onChange({ ...formatting, fontFamily: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Courier New">Courier New</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Styling Buttons */}
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Formatierung</label>
        <div className="flex gap-1">
          <Button
            onClick={toggleBold}
            variant={formatting.bold ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            title="Fett"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            onClick={toggleItalic}
            variant={formatting.italic ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            title="Kursiv"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            onClick={toggleUnderline}
            variant={formatting.underline ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            title="Unterstrichen"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Ausrichtung</label>
        <div className="flex gap-1">
          <Button
            onClick={() => onChange({ ...formatting, textAlign: 'left' })}
            variant={formatting.textAlign === 'left' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            title="Linksbündig"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => onChange({ ...formatting, textAlign: 'center' })}
            variant={formatting.textAlign === 'center' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            title="Zentriert"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => onChange({ ...formatting, textAlign: 'right' })}
            variant={formatting.textAlign === 'right' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            title="Rechtsbündig"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Textfarbe</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formatting.color || '#000000'}
            onChange={(e) => onChange({ ...formatting, color: e.target.value })}
            className="h-8 w-12 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formatting.color || '#000000'}
            onChange={(e) => onChange({ ...formatting, color: e.target.value })}
            placeholder="#000000"
            className="h-8 text-xs flex-1 px-2 border rounded"
          />
        </div>
      </div>

      {/* Line Height */}
      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Zeilenhöhe</label>
        <Select value={String(formatting.lineHeight || 1.5)} onValueChange={(v) => onChange({ ...formatting, lineHeight: parseFloat(v) })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Eng</SelectItem>
            <SelectItem value="1.5">Normal</SelectItem>
            <SelectItem value="2">Locker</SelectItem>
            <SelectItem value="2.5">Sehr locker</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}