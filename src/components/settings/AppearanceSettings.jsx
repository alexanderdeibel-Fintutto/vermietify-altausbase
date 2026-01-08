import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export default function AppearanceSettings({ user }) {
  const [settings, setSettings] = useState({
    theme: user.theme || 'light',
    language: user.language || 'de',
    compact_mode: user.compact_mode || false
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Darstellung aktualisiert');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Design</h3>
          <div className="space-y-4">
            <div>
              <Label>Farbschema</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Button
                  variant={settings.theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setSettings({...settings, theme: 'light'})}
                  className="w-full"
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Hell
                </Button>
                <Button
                  variant={settings.theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setSettings({...settings, theme: 'dark'})}
                  className="w-full"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dunkel
                </Button>
                <Button
                  variant={settings.theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setSettings({...settings, theme: 'system'})}
                  className="w-full"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  System
                </Button>
              </div>
            </div>

            <div>
              <Label>Sprache</Label>
              <Select value={settings.language} onValueChange={(val) => setSettings({...settings, language: val})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Layout</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label>Kompakt-Modus</Label>
              <p className="text-sm text-slate-600">Reduzierte Abstände für mehr Inhalte</p>
            </div>
            <Button
              variant={settings.compact_mode ? 'default' : 'outline'}
              onClick={() => setSettings({...settings, compact_mode: !settings.compact_mode})}
            >
              {settings.compact_mode ? 'Aktiv' : 'Inaktiv'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
        <Save className="w-4 h-4 mr-2" />
        Einstellungen speichern
      </Button>
    </div>
  );
}