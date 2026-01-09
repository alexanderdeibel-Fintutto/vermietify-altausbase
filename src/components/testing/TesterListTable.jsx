import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { User, Clock, AlertCircle } from 'lucide-react';

export default function TesterListTable({ testers = [] }) {
  if (!testers || testers.length === 0) {
    return (
      <Card className="p-12 text-center border border-slate-200">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-light">Noch keine aktiven Tester</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {testers.map(tester => (
        <Card key={tester.id} className="p-4 border border-slate-100 hover:border-slate-200 transition">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Name & Email */}
            <div>
              <p className="text-sm font-light text-slate-700">{tester.name}</p>
              <p className="text-xs font-light text-slate-400">{tester.email}</p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={tester.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                {tester.status === 'active' ? '🟢 Aktiv' : '⚪ Inaktiv'}
              </Badge>
            </div>

            {/* Aktivitäten */}
            <div className="text-xs font-light text-slate-600 space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {tester.sessions} Sessions / {tester.pages} Seiten
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-slate-400" />
                {tester.problems} Probleme
              </div>
            </div>

            {/* Letzter Login */}
            <div className="text-xs font-light text-slate-600">
              {tester.last_login ? (
                <>
                  <p className="font-medium text-slate-700">Letzter Login</p>
                  <p>{format(new Date(tester.last_login), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </>
              ) : (
                <p className="text-slate-400">Noch nicht angemeldet</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}