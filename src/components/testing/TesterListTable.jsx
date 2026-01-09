import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { User, Clock, AlertCircle } from 'lucide-react';

// Memoized row component to prevent unnecessary re-renders
const TesterRow = React.memo(({ tester }) => (
  <Card className="p-4 border border-slate-100 hover:border-slate-200 transition">
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
));

TesterRow.displayName = 'TesterRow';

export default function TesterListTable({ testers = [] }) {
  // Virtualized rendering for large lists (>50 items)
  const [scrollTop, setScrollTop] = React.useState(0);
  const itemHeight = 80;
  const containerHeight = Math.min(600, testers.length * itemHeight);
  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight));
    const endIdx = Math.min(testers.length, startIdx + visibleCount + 2);
    return { startIdx, endIdx, offsetY: startIdx * itemHeight };
  }, [scrollTop, testers.length, containerHeight]);

  if (!testers || testers.length === 0) {
    return (
      <Card className="p-12 text-center border border-slate-200">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-light">Noch keine aktiven Tester</p>
      </Card>
    );
  }

  // Use virtualization only for large lists
  if (testers.length > 50) {
    return (
      <div
        className="overflow-y-auto border border-slate-200 rounded-lg"
        style={{ height: containerHeight }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <div style={{ height: testers.length * itemHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${visibleRange.offsetY}px)` }}>
            {testers.slice(visibleRange.startIdx, visibleRange.endIdx).map(tester => (
              <TesterRow key={tester.id} tester={tester} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {testers.map(tester => (
        <TesterRow key={tester.id} tester={tester} />
      ))}
    </div>
  );
}