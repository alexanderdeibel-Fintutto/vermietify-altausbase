import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Copy, Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const BUILT_IN_TEMPLATES = [
  {
    id: 'contract-template',
    name: 'Mietvertrag Standard',
    category: 'contract',
    icon: '📋',
    description: 'Standardmietvertrag für Wohnungen'
  },
  {
    id: 'invoice-template',
    name: 'Rechnung Standard',
    category: 'invoice',
    icon: '🧾',
    description: 'Rechnungsvorlage mit Zahlungsbedingungen'
  },
  {
    id: 'reminder-email',
    name: 'Zahlungserinnerung',
    category: 'email',
    icon: '📧',
    description: 'Höfliche Zahlungserinnerung'
  },
  {
    id: 'handover-protocol',
    name: 'Übergabeprotokoll',
    category: 'form',
    icon: '✓',
    description: 'Einzugs-/Auszugsdokumentation'
  },
  {
    id: 'maintenance-request',
    name: 'Wartungsanfrage',
    category: 'form',
    icon: '🔧',
    description: 'Formular für Reparaturanfragen'
  },
  {
    id: 'termination-letter',
    name: 'Kündigungsschreiben',
    category: 'letter',
    icon: '📮',
    description: 'Mietvertrags-Kündigung'
  }
];

export default function QuickTemplateSelector({ open, onOpenChange, onSelect }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['custom-templates'],
    queryFn: () => base44.entities.DocumentTemplate.list()
  });

  const allTemplates = [...BUILT_IN_TEMPLATES];

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    if (onSelect) {
      onSelect(template);
    }
    toast.success(`📋 ${template.name} ausgewählt`);
  };

  const categories = [...new Set(allTemplates.map(t => t.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Schnell-Vorlagen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map(category => {
            const categoryTemplates = allTemplates.filter(t => t.category === category);
            const categoryLabel = {
              contract: '📋 Verträge',
              invoice: '🧾 Rechnungen',
              email: '📧 E-Mails',
              form: '✓ Formulare',
              letter: '📮 Schreiben'
            }[category] || category;

            return (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-3">{categoryLabel}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categoryTemplates.map(template => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-300"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <p className="text-2xl mb-2">{template.icon}</p>
                        <p className="font-medium text-sm text-slate-900">
                          {template.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(template);
                            }}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Kopieren
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3">⭐ Meine Vorlagen</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {customTemplates.map(template => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-amber-200"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <Badge className="mb-2">Custom</Badge>
                      <p className="font-medium text-sm text-slate-900">
                        {template.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        {template.category}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          {selectedTemplate && (
            <Button className="gap-2">
              <Edit2 className="w-4 h-4" />
              {selectedTemplate.name} bearbeiten
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}