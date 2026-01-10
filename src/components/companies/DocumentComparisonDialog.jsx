import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentComparisonDialog({ isOpen, onClose, versions }) {
  const [leftVersion, setLeftVersion] = useState(versions[0]?.id);
  const [rightVersion, setRightVersion] = useState(versions[1]?.id);

  const left = versions.find(v => v.id === leftVersion);
  const right = versions.find(v => v.id === rightVersion);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Versionen vergleichen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Version */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Version 1
              </label>
              <Select value={leftVersion} onValueChange={setLeftVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      Version {v.version_number} • {format(new Date(v.created_date), 'dd.MM.yyyy', { locale: de })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {left && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">
                    {format(new Date(left.created_date), 'dd. MMM yyyy HH:mm', { locale: de })}
                  </p>
                  {left.change_notes && (
                    <p className="text-xs text-slate-700 italic">{left.change_notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Version */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Version 2
              </label>
              <Select value={rightVersion} onValueChange={setRightVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      Version {v.version_number} • {format(new Date(v.created_date), 'dd.MM.yyyy', { locale: de })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {right && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">
                    {format(new Date(right.created_date), 'dd. MMm yyyy HH:mm', { locale: de })}
                  </p>
                  {right.change_notes && (
                    <p className="text-xs text-slate-700 italic">{right.change_notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comparison View */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <iframe
                src={left?.file_url}
                className="w-full h-96 rounded-lg border"
                title="Version 1 Preview"
              />
            </div>
            <div>
              <iframe
                src={right?.file_url}
                className="w-full h-96 rounded-lg border"
                title="Version 2 Preview"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              💡 Tipp: Öffnen Sie die Dateien in einem PDF-Editor für detaillierte Vergleiche und Markierungen.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}