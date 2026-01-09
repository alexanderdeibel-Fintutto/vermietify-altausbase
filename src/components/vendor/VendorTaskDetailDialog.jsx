import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function VendorTaskDetailDialog({ task, vendor, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{task.title}</CardTitle>
              {task.task_number && <p className="text-sm text-slate-600">#{task.task_number}</p>}
            </div>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Dienstleister</p>
              <p className="font-semibold">{vendor?.company_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <Badge>{task.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Kategorie</p>
              <p className="font-semibold">{task.category}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Priorität</p>
              <Badge>{task.priority}</Badge>
            </div>
          </div>
          {task.description && (
            <div>
              <p className="text-sm text-slate-600">Beschreibung</p>
              <p className="text-sm mt-1">{task.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-slate-600">Geschätzte Kosten</p>
              <p className="font-semibold">{task.estimated_cost || 0}€</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Tatsächliche Kosten</p>
              <p className="font-semibold text-blue-600">{task.actual_cost || 0}€</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}