import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileSearch } from 'lucide-react';

export default function ContractClauseAnalyzer({ contractId }) {
  const { data: analysis } = useQuery({
    queryKey: ['clauseAnalysis', contractId],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeContractClauses', { contract_id: contractId });
      return response.data;
    },
    enabled: !!contractId
  });

  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="w-5 h-5" />
          Vertragsklausel-Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {analysis.clauses.map((clause, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-sm">{clause.title}</p>
            <p className="text-xs text-slate-600 mt-1">{clause.analysis}</p>
            <Badge className={clause.risk === 'low' ? 'bg-green-600' : 'bg-orange-600'} className="mt-2">
              Risiko: {clause.risk}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}