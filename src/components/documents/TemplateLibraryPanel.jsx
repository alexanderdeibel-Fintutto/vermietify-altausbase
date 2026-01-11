import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Trash2, Download, Upload, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateLibraryPanel({ currentTemplate, onLoadTemplate }) {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('templateLibrary');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const saveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: templateName,
      description: templateDescription,
      blocks: currentTemplate.blocks,
      design: currentTemplate.design,
      pageSetup: currentTemplate.pageSetup,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('templateLibrary', JSON.stringify(updatedTemplates));
    
    toast.success(`Template "${templateName}" gespeichert!`);
    setTemplateName('');
    setTemplateDescription('');
    setShowSaveDialog(false);
  };

  const deleteTemplate = (id) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('templateLibrary', JSON.stringify(updatedTemplates));
    toast.success('Template gelöscht!');
    setSelectedTemplate(null);
  };

  const loadTemplate = (template) => {
    onLoadTemplate(template);
    toast.success(`Template "${template.name}" geladen!`);
    setSelectedTemplate(null);
  };

  const exportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${template.name}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Template exportiert!');
  };

  const importTemplate = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result);
        const template = {
          ...imported,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        const updatedTemplates = [...templates, template];
        setTemplates(updatedTemplates);
        localStorage.setItem('templateLibrary', JSON.stringify(updatedTemplates));
        toast.success('Template importiert!');
      } catch (err) {
        toast.error('Fehler beim Import: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 gap-2 h-9"
        >
          <Save className="w-4 h-4" /> Speichern
        </Button>
        <label>
          <Button asChild variant="outline" className="gap-2 h-9">
            <span><Upload className="w-4 h-4" /> Importieren</span>
            <input
              type="file"
              accept=".json"
              onChange={importTemplate}
              className="hidden"
            />
          </Button>
        </label>
      </div>

      {showSaveDialog && (
        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
          <h4 className="font-medium text-slate-900">Template speichern</h4>
          <Input
            placeholder="Template-Name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="Beschreibung (optional)..."
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={saveTemplate} className="flex-1 h-8 text-xs">Speichern</Button>
            <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="flex-1 h-8 text-xs">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium text-sm text-slate-900">
          Gespeicherte Templates ({templates.length})
        </h4>

        {templates.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            Keine Templates gespeichert
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.map(template => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{template.name}</p>
                    <p className="text-xs text-slate-500">{template.description}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(template.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>

                {selectedTemplate?.id === template.id && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={() => loadTemplate(template)}
                      size="sm"
                      className="flex-1 h-7 text-xs gap-1"
                    >
                      <Download className="w-3 h-3" /> Laden
                    </Button>
                    <Button
                      onClick={() => exportTemplate(template)}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs gap-1"
                    >
                      <Upload className="w-3 h-3" /> Export
                    </Button>
                    <Button
                      onClick={() => deleteTemplate(template.id)}
                      size="sm"
                      variant="destructive"
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}