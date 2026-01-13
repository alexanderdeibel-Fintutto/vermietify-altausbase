import React, { useState } from 'react';
import { Link as LinkIcon, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SmartLinking({
  entityId,
  entityType,
  linkedItems = [],
  availableEntities = [],
  onLink,
  onUnlink,
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleLink = async () => {
    for (const entityId of selected) {
      await onLink?.(entityId);
    }
    setSelected([]);
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <LinkIcon className="w-4 h-4" />
        Verknüpfen ({linkedItems.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entitäten verknüpfen</DialogTitle>
            <DialogDescription>
              Wählen Sie die Entitäten aus, die verknüpft werden sollen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableEntities.map((entity) => (
              <label
                key={entity.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(entity.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected([...selected, entity.id]);
                    } else {
                      setSelected(selected.filter(id => id !== entity.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">{entity.name}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={() => setOpen(false)} variant="outline">
              Abbrechen
            </Button>
            <Button onClick={handleLink}>Verknüpfen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {linkedItems.length > 0 && (
        <div className="space-y-2 mt-4">
          {linkedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-slate-50 rounded"
            >
              <span className="text-sm text-slate-700">{item.name}</span>
              <Button
                onClick={() => onUnlink?.(item.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}