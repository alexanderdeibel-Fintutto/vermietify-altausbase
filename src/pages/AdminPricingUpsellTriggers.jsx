import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';

export default function AdminPricingUpsellTriggers() {
  const queryClient = useQueryClient();
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: triggers = [] } = useQuery({
    queryKey: ['upsellTriggers'],
    queryFn: () => base44.entities.UpsellTrigger.list('-priority')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTrigger?.id) {
        return await base44.entities.UpsellTrigger.update(editingTrigger.id, data);
      } else {
        return await base44.entities.UpsellTrigger.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsellTriggers'] });
      setDialogOpen(false);
      setEditingTrigger(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.UpsellTrigger.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsellTriggers'] });
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Upsell-Trigger</h1>
          <p className="text-slate-600 mt-1">Automatische Upgrade-Vorschläge</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTrigger(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrigger ? 'Trigger bearbeiten' : 'Neuer Trigger'}</DialogTitle>
            </DialogHeader>
            <TriggerForm
              trigger={editingTrigger}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setEditingTrigger(null);
              }}
              isSaving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {triggers.map(trigger => (
          <Card key={trigger.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-light">{trigger.data.name}</h3>
                    <Badge variant="secondary" className="font-mono">
                      {trigger.data.trigger_code}
                    </Badge>
                    {trigger.data.is_active ? (
                      <Badge>Aktiv</Badge>
                    ) : (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-600 mt-2 text-sm">{trigger.data.description}</p>
                  
                  <div className="flex gap-6 mt-3 text-sm">
                    <div>
                      <span className="text-slate-500">Typ:</span>{' '}
                      <span>{trigger.data.trigger_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Ziel:</span>{' '}
                      <span>{trigger.data.target_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Anzeige:</span>{' '}
                      <span>{trigger.data.display_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Priorität:</span>{' '}
                      <span>{trigger.data.priority}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="font-medium mb-1">{trigger.data.message_title}</div>
                    <div className="text-slate-600">{trigger.data.message_body}</div>
                    <Button size="sm" className="mt-2" variant="outline">
                      {trigger.data.message_cta}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTrigger(trigger);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Trigger wirklich löschen?')) {
                        deleteMutation.mutate(trigger.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {triggers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Noch keine Trigger erstellt
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}