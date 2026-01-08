import React from 'react';
import { User, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ActivityLogTable({ activities }) {
  const getActionIcon = (action) => {
    switch(action) {
      case 'create': return <Plus className="w-4 h-4 text-green-600" />;
      case 'update': return <Edit2 className="w-4 h-4 text-blue-600" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getActionLabel = (action) => {
    switch(action) {
      case 'create': return 'Erstellt';
      case 'update': return 'Aktualisiert';
      case 'delete': return 'Gelöscht';
      default: return action;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Benutzer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Aktion</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Entity</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Zeit</th>
          </tr>
        </thead>
        <tbody>
          {activities?.map((activity, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />{activity.user_name || '—'}</td>
              <td className="px-6 py-4 text-sm flex items-center gap-2">{getActionIcon(activity.action)} {getActionLabel(activity.action)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{activity.entity_type || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{activity.details || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{activity.timestamp ? format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}