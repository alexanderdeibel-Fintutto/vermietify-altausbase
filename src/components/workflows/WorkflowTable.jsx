import React from 'react';
import { Zap, Edit, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function WorkflowTable({ workflows, onEdit, onDelete, onToggle }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trigger</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Schritte</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {workflows?.map((workflow, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-cyan-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-600" />{workflow.name || 'Workflow'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{workflow.trigger || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{workflow.step_count || 0}</td>
              <td className="px-6 py-4">
                <Button size="icon" variant="ghost" onClick={() => onToggle?.(workflow)}>
                  {workflow.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                </Button>
              </td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => onEdit?.(workflow)}><Edit className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(workflow)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}