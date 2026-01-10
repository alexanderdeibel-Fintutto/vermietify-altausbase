import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function ApprovalConfigPanel({ approval, onChange }) {
  const [approverEmail, setApproverEmail] = useState('');

  const addApprover = () => {
    if (approverEmail) {
      const updated = {
        ...approval,
        approvers: [
          ...(approval.approvers || []),
          approverEmail
        ]
      };
      onChange(updated);
      setApproverEmail('');
    }
  };

  const removeApprover = (email) => {
    const updated = {
      ...approval,
      approvers: approval.approvers.filter(e => e !== email)
    };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Genehmigungskonfiguration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Approval Type */}
        <div>
          <label className="text-sm font-medium text-slate-700">Genehmigungstyp</label>
          <select
            value={approval.approval_type || 'sequential'}
            onChange={(e) => onChange({ ...approval, approval_type: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
          >
            <option value="sequential">
              Sequenziell - nacheinander durch alle Genehmiger
            </option>
            <option value="parallel">
              Parallel - alle Genehmiger gleichzeitig
            </option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {approval.approval_type === 'sequential'
              ? 'Jeder Genehmiger muss nacheinander freigeben'
              : 'Alle Genehmiger müssen parallel freigeben'}
          </p>
        </div>

        {/* Timeout */}
        <div>
          <label className="text-sm font-medium text-slate-700">Genehmigungsfrist (Tage)</label>
          <Input
            type="number"
            min="1"
            value={approval.timeout_days || 5}
            onChange={(e) => onChange({ ...approval, timeout_days: parseInt(e.target.value) })}
            className="mt-1"
          />
        </div>

        {/* Approvers */}
        <div>
          <label className="text-sm font-medium text-slate-700">Genehmiger</label>
          <div className="mt-2 flex gap-2">
            <Input
              type="email"
              placeholder="E-Mail-Adresse"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addApprover()}
            />
            <Button onClick={addApprover} variant="outline" size="sm">
              Hinzufügen
            </Button>
          </div>

          {/* Approvers List */}
          {approval.approvers && approval.approvers.length > 0 && (
            <div className="mt-3 space-y-2">
              {approval.approvers.map((email, idx) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{email}</p>
                    <p className="text-xs text-slate-600">
                      Schritt {approval.approval_type === 'parallel' ? '(parallel)' : `${idx + 1}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeApprover(email)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}