import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2 } from 'lucide-react';

export default function SmartFormPrefill({ formType }) {
  return (
    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-purple-600" />
        <div>
          <p className="text-sm font-semibold">Auto-Vervollständigung aktiv</p>
          <p className="text-xs text-slate-600">Felder werden basierend auf früheren Eingaben vorausgefüllt</p>
        </div>
        <Badge className="bg-purple-600">KI</Badge>
      </div>
    </div>
  );
}