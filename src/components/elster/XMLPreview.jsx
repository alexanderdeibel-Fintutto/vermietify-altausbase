import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function XMLPreview({ xmlData, submission }) {
  if (!xmlData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">Kein XML verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xmlData);
    toast.success('XML in Zwischenablage kopiert');
  };

  const downloadXML = () => {
    const blob = new Blob([xmlData], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submission?.tax_form_type || 'elster'}_${submission?.tax_year || 'export'}.xml`;
    a.click();
    toast.success('XML heruntergeladen');
  };

  // Simple syntax highlighting
  const highlightXML = (xml) => {
    return xml
      .replace(/(&lt;)([^&]*?)(&gt;)/g, '<span class="text-blue-600">$1$2$3</span>')
      .replace(/="([^"]*)"/g, '=<span class="text-green-600">"$1"</span>');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            XML-Vorschau
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-1" />
              Kopieren
            </Button>
            <Button variant="outline" size="sm" onClick={downloadXML}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Badge variant="outline" className="absolute top-2 right-2 z-10">
            {xmlData.length.toLocaleString()} Zeichen
          </Badge>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-96 overflow-y-auto">
            {xmlData}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}