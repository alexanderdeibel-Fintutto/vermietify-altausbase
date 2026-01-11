import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Table2, 
  Image, 
  Minus, 
  PlusSquare, 
  FileText,
  CheckSquare
} from 'lucide-react';

const COMPONENTS = [
  {
    id: 'heading',
    label: 'Überschrift',
    icon: Type,
    description: 'H1-H3 Überschriften'
  },
  {
    id: 'text',
    label: 'Text',
    icon: FileText,
    description: 'Absätze & Content'
  },
  {
    id: 'table',
    label: 'Tabelle',
    icon: Table2,
    description: 'Datengruppen'
  },
  {
    id: 'image',
    label: 'Bild/Logo',
    icon: Image,
    description: 'Bilder einfügen'
  },
  {
    id: 'divider',
    label: 'Linie',
    icon: Minus,
    description: 'Visueller Separator'
  },
  {
    id: 'signature',
    label: 'Unterschrift',
    icon: CheckSquare,
    description: 'Unterschriftsfeld'
  },
  {
    id: 'spacer',
    label: 'Abstand',
    icon: PlusSquare,
    description: 'Vertikaler Platz'
  }
];

export default function TemplateComponentLibrary({ onAddBlock }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700">Komponenten</h3>
      <div className="space-y-2">
        {COMPONENTS.map(component => {
          const Icon = component.icon;
          return (
            <Button
              key={component.id}
              onClick={() => onAddBlock(component.id)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-2"
            >
              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{component.label}</p>
                <p className="text-xs text-slate-500">{component.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}