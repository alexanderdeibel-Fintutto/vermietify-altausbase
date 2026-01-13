import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function BankingAutomationHub() {
  const { data: rules = [] } = useQuery({
    queryKey: ['banking-rules'],
    queryFn: () => base44.entities.BankingAutomationRule.list()
  });

  const activeRules = rules.filter(r => r.active);
  const totalMatches = rules.reduce((sum, r) => sum + (r.match_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Banking Automation</h1>
          <p className="text-slate-600">Auto-Kategorisierung & Steueroptimierung</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{activeRules.length}</div>
            <p className="text-sm text-slate-600">Aktive Regeln</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{totalMatches}</div>
            <p className="text-sm text-slate-600">Transactions verarbeitet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {Math.round(activeRules.reduce((sum, r) => sum + r.confidence_level, 0) / activeRules.length || 0)}%
            </div>
            <p className="text-sm text-slate-600">Durchschn. Confidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Button className="w-full">+ Regel hinzufügen</Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{rule.rule_name}</p>
                  <p className="text-xs text-slate-600">{rule.auto_category}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{rule.confidence_level}% Confidence</Badge>
                  <Badge className={rule.active ? 'bg-green-100 text-green-800' : ''}>
                    {rule.match_count} Matches
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}