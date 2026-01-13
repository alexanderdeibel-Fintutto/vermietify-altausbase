import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SaveTemplateDialog({ open, onOpenChange, invoiceData }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return await base44.asServiceRole.entities.InvoiceTemplate.create({
        name,
        description,
        user_email: user.email,
        recipient: invoiceData.recipient,
        cost_category_id: invoiceData.cost_category_id,
        type: invoiceData.type,
        operating_cost_relevant: invoiceData.operating_cost_relevant,
        building_id: invoiceData.building_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast.success(`Template "${name}" gespeichert`);
      setName('');
      setDescription('');
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Template speichern</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Template-Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. 'Miete monatlich'"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Beschreibung (optional)</label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!name || saveMutation.isPending}
            >
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}