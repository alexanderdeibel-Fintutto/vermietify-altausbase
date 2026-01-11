import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Code, Eye } from 'lucide-react';
import TemplateFieldManager from './TemplateFieldManager';

export default function TemplateEditor({ template, onChange }) {
  const [mode, setMode] = useState('visual'); // visual, code, fields

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="visual" className="flex gap-2">
            <Eye className="w-4 h-4" /> Visuell
          </TabsTrigger>
          <TabsTrigger value="code" className="flex gap-2">
            <Code className="w-4 h-4" /> HTML-Code
          </TabsTrigger>
          <TabsTrigger value="fields">Felder</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Editor Links */}
            <div className="space-y-3">
              <h3 className="font-semibold">HTML-Editor</h3>
              <Textarea
                value={template.template_html || ''}
                onChange={(e) => onChange({ ...template, template_html: e.target.value })}
                placeholder="<h1>{{title}}</h1>..."
                className="font-mono text-xs h-96"
              />
            </div>

            {/* Preview Rechts */}
            <div className="space-y-3">
              <h3 className="font-semibold">Vorschau</h3>
              <div className="border rounded-lg p-4 bg-white h-96 overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: template.template_html || '<p>Leer</p>' }} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code">
          <div className="space-y-3">
            <h3 className="font-semibold">Bearbeiten Sie das HTML direkt</h3>
            <Textarea
              value={template.template_html || ''}
              onChange={(e) => onChange({ ...template, template_html: e.target.value })}
              className="font-mono text-sm h-screen"
            />
          </div>
        </TabsContent>

        <TabsContent value="fields">
          <TemplateFieldManager
            fields={template.template_fields || []}
            onChange={(fields) => onChange({ ...template, template_fields: fields })}
            documentType={template.document_type}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}