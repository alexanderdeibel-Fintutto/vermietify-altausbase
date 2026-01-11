import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export default function LetterTemplateSelector({ onSelect }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    { id: 1, name: 'Zahlungserinnerung', category: 'Finanzen', icon: '💳' },
    { id: 2, name: 'Wartungsankündigung', category: 'Wartung', icon: '🔧' },
    { id: 3, name: 'Kündigungsbestätigung', category: 'Verträge', icon: '📋' },
    { id: 4, name: 'Kaution-Gutschrift', category: 'Finanzen', icon: '✅' },
    { id: 5, name: 'Mieterhöhung', category: 'Verträge', icon: '📈' },
    { id: 6, name: 'Beschwerde-Antwort', category: 'Service', icon: '💬' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Brief-Vorlage auswählen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-xl mb-1">{template.icon}</p>
              <p className="text-xs font-medium">{template.name}</p>
              <p className="text-xs text-slate-500">{template.category}</p>
            </button>
          ))}
        </div>

        <Button className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Neue Vorlage erstellen
        </Button>

        {selectedTemplate && (
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Vorlage verwenden
          </Button>
        )}
      </CardContent>
    </Card>
  );
}