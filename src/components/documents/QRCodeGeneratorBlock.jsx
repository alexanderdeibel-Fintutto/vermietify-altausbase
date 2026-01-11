import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

export default function QRCodeGeneratorBlock({ block, onUpdate, onDelete }) {
  const [qrValue, setQrValue] = useState(block.qrValue || 'https://example.com');
  const [qrUrl, setQrUrl] = useState(block.qrUrl || '');
  const [size, setSize] = useState(block.size || 200);
  const [errorLevel, setErrorLevel] = useState(block.errorLevel || 'M');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    if (!qrValue.trim()) return;
    
    setLoading(true);
    try {
      const url = await QRCode.toDataURL(qrValue, {
        errorCorrectionLevel: errorLevel,
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: size,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrUrl(url);
      onUpdate({ ...block, qrValue, qrUrl: url, size, errorLevel });
    } catch (err) {
      console.error('QR-Code Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (e) => {
    setQrValue(e.target.value);
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setSize(newSize);
  };

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
      <h4 className="font-medium text-sm text-slate-900">QR-Code Generator</h4>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-2">QR-Code Wert</label>
        <Textarea
          value={qrValue}
          onChange={handleValueChange}
          placeholder="https://example.com oder Text eingeben..."
          rows={3}
          className="text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Größe (px)</label>
          <Input
            type="number"
            value={size}
            onChange={handleSizeChange}
            min="100"
            max="500"
            step="10"
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Fehlerkorrektur</label>
          <select
            value={errorLevel}
            onChange={(e) => setErrorLevel(e.target.value)}
            className="w-full h-8 text-xs border rounded px-2"
          >
            <option value="L">L (7%)</option>
            <option value="M">M (15%)</option>
            <option value="Q">Q (25%)</option>
            <option value="H">H (30%)</option>
          </select>
        </div>
      </div>

      {qrUrl && (
        <div className="flex justify-center p-3 bg-white rounded border">
          <img src={qrUrl} alt="QR-Code" style={{ width: size, height: size }} />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={generateQRCode}
          disabled={loading}
          size="sm"
          className="flex-1 h-8 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" /> {loading ? 'Generiere...' : 'Generieren'}
        </Button>
        <Button
          onClick={onDelete}
          variant="destructive"
          size="sm"
          className="h-8 text-xs"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}