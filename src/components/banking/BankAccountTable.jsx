import React from 'react';
import { CreditCard, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function BankAccountTable({ accounts, onEdit, onDelete }) {
  const [visibleAccounts, setVisibleAccounts] = React.useState({});

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kontoinhaber</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">IBAN</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Saldo</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Typ</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {accounts?.map((account, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-teal-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-teal-600" />{account.holder_name}</td>
              <td className="px-6 py-4 text-sm text-slate-700 font-mono">{visibleAccounts[idx] ? account.iban : account.iban?.slice(-4).padStart(account.iban.length, '*')}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(account.balance || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{account.type === 'checking' ? 'Girokonto' : 'Sparkonto'}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => setVisibleAccounts({...visibleAccounts, [idx]: !visibleAccounts[idx]})}>{visibleAccounts[idx] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(account)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}