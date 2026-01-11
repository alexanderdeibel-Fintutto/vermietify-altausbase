import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateCanvasPreview({ blocks, design, template }) {
  const exportAsHTML = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${template.document_type}</title>
  <style>
    body {
      font-family: ${design.font};
      color: ${design.primaryColor};
      margin: 0;
      padding: 2rem;
      background: #f8fafc;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      padding: 3rem;
      border-radius: ${design.borderRadius};
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Generated from template -->
  </div>
</body>
</html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.document_type}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('HTML exportiert!');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={exportAsHTML} className="gap-2">
          <Download className="w-4 h-4" />
          Als HTML exportieren
        </Button>
      </div>

      <div
        className="min-h-screen p-8 rounded-lg bg-slate-50"
        style={{
          fontFamily: design.font,
          color: design.primaryColor
        }}
      >
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-lg">
          {blocks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Keine Blöcke - füge Komponenten hinzu um Vorschau zu sehen
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, idx) => (
                <div key={idx}>
                  {block.type === 'heading' && (
                    <h2 className="text-2xl font-bold mb-4" style={{ color: design.primaryColor }}>
                      {block.content || 'Überschrift'}
                    </h2>
                  )}
                  {block.type === 'text' && (
                    <p className="text-sm leading-relaxed mb-4">
                      {block.content || 'Text...'}
                    </p>
                  )}
                  {block.type === 'divider' && (
                    <hr className="my-6" style={{ borderColor: design.primaryColor }} />
                  )}
                  {block.type === 'signature' && (
                    <div className="mt-8">
                      <p className="text-xs text-slate-600 mb-2">Unterschrift</p>
                      <div className="w-40 h-16 border-b-2" style={{ borderColor: design.primaryColor }}></div>
                    </div>
                  )}
                  {block.type === 'spacer' && <div className="h-6"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}