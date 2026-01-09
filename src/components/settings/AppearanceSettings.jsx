import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from '@/components/theme/ThemeProvider';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';

export default function AppearanceSettings({ user }) {
  const { currentThemeKey, switchTheme, availableThemes } = useTheme();

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Design-Theme</h3>
          <p className="text-sm text-slate-600 mb-4">Wählen Sie ein vordefiniertes Theme oder passen Sie das Design nach Ihren Wünschen an.</p>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Sprache</h3>
          <div>
            <Label>Sprache</Label>
            <Select value={user.language || 'de'}>
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
        </CardContent>
      </Card>
    </div>
  );
}