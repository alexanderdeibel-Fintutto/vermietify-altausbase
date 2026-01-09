import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from 'lucide-react';
import ThemePreviewPanel from './ThemePreviewPanel';
import ColorTokenEditor from './ColorTokenEditor';
import TypographyTokenEditor from './TypographyTokenEditor';
import SpacingTokenEditor from './SpacingTokenEditor';
import EffectsTokenEditor from './EffectsTokenEditor';
import { toast } from 'sonner';

const defaultTokens = {
  colors: {
    primary_50: '#f8f4ff',
    primary_100: '#f3e8ff',
    primary_200: '#e9d5ff',
    primary_300: '#d8b4fe',
    primary_400: '#c084fc',
    primary_500: '#a855f7',
    primary_600: '#9333ea',
    primary_700: '#7e22ce',
    primary_800: '#6b21a8',
    primary_900: '#581c87',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    foreground: '#000000',
    muted: '#f3f4f6',
    muted_foreground: '#6b7280',
    border: '#e5e7eb',
  },
  typography: {
    font_family_primary: 'system-ui, -apple-system, sans-serif',
    font_size_xs: '0.75rem',
    font_size_sm: '0.875rem',
    font_size_base: '1rem',
    font_size_lg: '1.125rem',
    font_size_xl: '1.25rem',
    font_weight_extralight: '200',
    font_weight_light: '300',
    font_weight_normal: '400',
    font_weight_medium: '500',
    font_weight_semibold: '600',
    font_weight_bold: '700',
  },
  spacing: {
    spacing_xs: '0.25rem',
    spacing_sm: '0.5rem',
    spacing_md: '1rem',
    spacing_lg: '1.5rem',
    spacing_xl: '2rem',
  },
  effects: {
    radius_sm: '0.25rem',
    radius_md: '0.5rem',
    radius_lg: '0.75rem',
    radius_xl: '1rem',
    shadow_sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadow_md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadow_lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition_fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transition_normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transition_slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default function ThemeEditorDialog({ theme, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: theme?.name || '',
    key: theme?.key || '',
    description: theme?.description || '',
    design_tokens: theme?.design_tokens || defaultTokens,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (theme?.id) {
        return base44.entities.Theme.update(theme.id, data);
      } else {
        return base44.entities.Theme.create(data);
      }
    },
    onSuccess: () => {
      toast.success(theme ? 'Theme aktualisiert' : 'Theme erstellt');
      onSave();
    },
  });

  const handleSave = () => {
    if (!formData.name || !formData.key) {
      toast.error('Name und Schlüssel erforderlich');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleTokenChange = (category, tokenKey, value) => {
    setFormData({
      ...formData,
      design_tokens: {
        ...formData.design_tokens,
        [category]: {
          ...formData.design_tokens[category],
          [tokenKey]: value,
        },
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {theme ? 'Theme bearbeiten' : 'Neues Theme erstellen'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Editor */}
          <div className="col-span-2 space-y-4">
            <div>
              <Label>Theme-Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Dark Mode"
              />
            </div>

            <div>
              <Label>Eindeutiger Schlüssel</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="z.B. dark"
                disabled={!!theme}
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kurze Beschreibung des Themes"
              />
            </div>

            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">Farben</TabsTrigger>
                <TabsTrigger value="typography">Typographie</TabsTrigger>
                <TabsTrigger value="spacing">Abstände</TabsTrigger>
                <TabsTrigger value="effects">Effekte</TabsTrigger>
              </TabsList>

              <TabsContent value="colors">
                <ColorTokenEditor
                  tokens={formData.design_tokens.colors}
                  onChange={(key, value) => handleTokenChange('colors', key, value)}
                />
              </TabsContent>

              <TabsContent value="typography">
                <TypographyTokenEditor
                  tokens={formData.design_tokens.typography}
                  onChange={(key, value) => handleTokenChange('typography', key, value)}
                />
              </TabsContent>

              <TabsContent value="spacing">
                <SpacingTokenEditor
                  tokens={formData.design_tokens.spacing}
                  onChange={(key, value) => handleTokenChange('spacing', key, value)}
                />
              </TabsContent>

              <TabsContent value="effects">
                <EffectsTokenEditor
                  tokens={formData.design_tokens.effects}
                  onChange={(key, value) => handleTokenChange('effects', key, value)}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          <div className="col-span-1">
            <ThemePreviewPanel tokens={formData.design_tokens} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}