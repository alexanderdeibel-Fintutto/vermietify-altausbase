import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import ThemeEditor from '@/components/theme/ThemeEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ThemeManagementPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: themes = [], isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Theme.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setIsEditorOpen(false);
      setSelectedTheme(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Theme.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setIsEditorOpen(false);
      setSelectedTheme(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Theme.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setDeleteConfirm(null);
    },
  });

  const handleSaveTheme = (formData) => {
    if (selectedTheme?.id) {
      updateMutation.mutate({ id: selectedTheme.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleNewTheme = () => {
    setSelectedTheme(null);
    setIsEditorOpen(true);
  };

  const handleEditTheme = (theme) => {
    setSelectedTheme(theme);
    setIsEditorOpen(true);
  };

  if (isLoading) return <div className="p-8">Lädt...</div>;

  return (
    <div className="p-8">
      <PageHeader 
        title="Theme-Verwaltung"
        subtitle="Verwalte Themes und Design-Einstellungen"
        action={handleNewTheme}
        actionLabel="Neues Theme"
      />

      <div className="grid gap-4">
        {themes.map(theme => (
          <div key={theme.id} className="border border-slate-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-light text-lg text-slate-900">{theme.name}</h3>
                <p className="text-sm text-slate-500">{theme.key}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditTheme(theme)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Bearbeiten
                </Button>
                {!theme.is_system_theme && (
                  <Button
                    onClick={() => setDeleteConfirm(theme)}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </Button>
                )}
              </div>
            </div>

            {/* Color preview */}
            <div className="flex gap-2 mt-4">
              {Object.values(theme.design_tokens.colors || {}).slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ThemeEditor
        theme={selectedTheme}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTheme}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Theme löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Dieses Theme kann nicht wiederhergestellt werden.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Abbrechen</Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}