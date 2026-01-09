import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Copy, Trash2, Lock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ThemeEditorDialog from '@/components/theme/ThemeEditorDialog';
import ThemePreviewCard from '@/components/theme/ThemePreviewCard';
import { toast } from 'sonner';

export default function ThemeManagement() {
  const [editingTheme, setEditingTheme] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const queryClient = useQueryClient();

  const { data: themes = [], isLoading } = useQuery({
    queryKey: ['themes-management'],
    queryFn: () => base44.entities.Theme.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (themeId) => base44.entities.Theme.delete(themeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes-management'] });
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      toast.success('Theme gelöscht');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (theme) => {
      const newTheme = {
        ...theme,
        id: undefined,
        name: `${theme.name} (Kopie)`,
        key: `${theme.key}-copy-${Date.now()}`,
        is_system_theme: false,
        is_default: false,
      };
      return base44.entities.Theme.create(newTheme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes-management'] });
      toast.success('Theme dupliziert');
    },
  });

  const handleEdit = (theme) => {
    setEditingTheme(theme);
    setShowEditor(true);
  };

  const handleDelete = (themeId) => {
    if (window.confirm('Theme wirklich löschen?')) {
      deleteMutation.mutate(themeId);
    }
  };

  const handleDuplicate = (theme) => {
    duplicateMutation.mutate(theme);
  };

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme-Verwaltung"
        subtitle="Erstellen und verwalten Sie Design-Themes"
        action={() => {
          setEditingTheme(null);
          setShowEditor(true);
        }}
        actionLabel="Neues Theme"
      />

      {themes.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Keine Themes vorhanden"
          description="Erstellen Sie Ihr erstes Theme um Ihr Design anzupassen"
          action={() => {
            setEditingTheme(null);
            setShowEditor(true);
          }}
          actionLabel="Theme erstellen"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <Card key={theme.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {theme.name}
                      {theme.is_system_theme && <Lock className="w-4 h-4 text-slate-400" />}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{theme.key}</p>
                  </div>
                  {theme.is_default && (
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Standard
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                <ThemePreviewCard theme={theme} />
              </CardContent>

              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(theme)}
                  className="flex-1"
                  disabled={theme.is_system_theme}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(theme)}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Kopieren
                </Button>
                {!theme.is_system_theme && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(theme.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showEditor && (
        <ThemeEditorDialog
          theme={editingTheme}
          onClose={() => {
            setShowEditor(false);
            setEditingTheme(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['themes-management'] });
            queryClient.invalidateQueries({ queryKey: ['themes'] });
            setShowEditor(false);
            setEditingTheme(null);
          }}
        />
      )}
    </div>
  );
}