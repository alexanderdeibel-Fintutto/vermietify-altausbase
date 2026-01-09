import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ThemeEditor({ theme, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(theme || {
    name: '',
    key: '',
    description: '',
    design_tokens: {
      colors: {},
      typography: {},
      effects: {},
    },
  });

  const handleColorChange = (colorKey, value) => {
    setFormData({
      ...formData,
      design_tokens: {
        ...formData.design_tokens,
        colors: {
          ...formData.design_tokens.colors,
          [colorKey]: value,
        },
      },
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{theme ? 'Theme bearbeiten' : 'Neues Theme'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Theme-Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Dark Mode"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Schlüssel</label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="z.B. dark"
                disabled={theme?.is_system_theme}
              />
            </div>
          </div>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Farben</TabsTrigger>
              <TabsTrigger value="typography">Typografie</TabsTrigger>
              <TabsTrigger value="effects">Effekte</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-3">
              {Object.keys(formData.design_tokens.colors || {}).map(colorKey => (
                <div key={colorKey} className="flex items-center gap-3">
                  <label className="text-sm w-32">{colorKey}</label>
                  <input
                    type="color"
                    value={formData.design_tokens.colors[colorKey] || '#000000'}
                    onChange={(e) => handleColorChange(colorKey, e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.design_tokens.colors[colorKey] || ''}
                    onChange={(e) => handleColorChange(colorKey, e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="typography">
              <p className="text-sm text-slate-500">Typografie-Einstellungen</p>
            </TabsContent>

            <TabsContent value="effects">
              <p className="text-sm text-slate-500">Effekt-Einstellungen</p>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} className="bg-slate-700 hover:bg-slate-800">Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}