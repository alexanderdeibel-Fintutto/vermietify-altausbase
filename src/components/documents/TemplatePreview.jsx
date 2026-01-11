import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export default function TemplatePreview({ template, fields = [] }) {
  const [previewData, setPreviewData] = useState({});

  const renderPreview = () => {
    let html = template.template_html || '';

    // Replace placeholders with preview data or field names
    fields.forEach(field => {
      const value = previewData[field.name] || `[${field.name}]`;
      const regex = new RegExp(`{{${field.name}}}`, 'g');
      html = html.replace(regex, value);
    });

    // Replace remaining placeholders with field names
    html = html.replace(/{{(\w+)}}/g, '[$1]');

    return html;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Felder Links */}
        <div className="space-y-3 col-span-1">
          <h3 className="font-semibold text-sm">Test-Daten eingeben</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fields.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">Keine Felder definiert</p>
              </div>
            )}
            {fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs font-medium">{field.name}</Label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={previewData[field.name] || ''}
                    onChange={(e) => setPreviewData({ ...previewData, [field.name]: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-xs"
                    rows={2}
                  />
                ) : (
                  <Input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={previewData[field.name] || ''}
                    onChange={(e) => setPreviewData({ ...previewData, [field.name]: e.target.value })}
                    placeholder={`Test ${field.type}`}
                    className="text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vorschau Rechts */}
        <div className="col-span-2 space-y-3">
          <h3 className="font-semibold text-sm">Live-Vorschau</h3>
          <div className="border rounded-lg p-6 bg-white min-h-96 max-h-96 overflow-auto">
            <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
          </div>
          <Button className="w-full">Als PDF herunterladen</Button>
        </div>
      </div>
    </div>
  );
}