import React from 'react';
import { Copy, Eye, EyeOff, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function APIKeyTable({ keys, onDelete, onToggle }) {
  const [visibleKeys, setVisibleKeys] = React.useState({});

  const toggleVisibility = (id) => {
    setVisibleKeys(prev => ({...prev, [id]: !prev[id]}));
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Key</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Erstellt</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {keys?.map((key, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{key.name || '—'}</td>
              <td className="px-6 py-4 text-sm font-mono text-slate-700 flex items-center gap-2">
                {visibleKeys[idx] ? key.key_value?.substring(0, 32) : '••••••••••••••••••••••••••••••••'}
                <Button size="icon" variant="ghost" onClick={() => toggleVisibility(idx)}>
                  {visibleKeys[idx] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(key.key_value)}>
                  <Copy className="w-4 h-4 text-slate-600" />
                </Button>
              </td>
              <td className="px-6 py-4 text-sm text-slate-700">{key.created_date ? format(new Date(key.created_date), 'dd.MM.yyyy', { locale: de }) : '—'}</td>
              <td className="px-6 py-4">
                <Button size="icon" variant="ghost" onClick={() => onToggle?.(key)}>
                  {key.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                </Button>
              </td>
              <td className="px-6 py-4 text-right">
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(key)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}