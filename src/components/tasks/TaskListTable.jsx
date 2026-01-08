import React from 'react';
import { Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TaskListTable({ tasks, onEdit, onDelete, onToggle }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Aufgabe</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Priorität</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fällig</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {tasks?.map((task, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.title}</td>
              <td className="px-6 py-4 text-sm"><span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">{task.priority || 'Normal'}</span></td>
              <td className="px-6 py-4 text-sm text-slate-700">{task.due_date || '—'}</td>
              <td className="px-6 py-4">
                <Button size="icon" variant="ghost" onClick={() => onToggle?.(task)}>
                  {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-slate-400" />}
                </Button>
              </td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => onEdit?.(task)}><Pencil className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(task)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}