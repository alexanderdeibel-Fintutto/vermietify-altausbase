import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BankTransactionMatches({ transaction, onMatch }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestBankTransactionMatches', {
        bank_transaction_id: transaction.id
      });

      if (response.data.potential_matches?.length > 0) {
        setMatches(response.data.potential_matches);
        toast.success(`${response.data.potential_matches.length} Vorschläge gefunden`);
      } else {
        toast.info('Keine Vorschläge gefunden');
      }
    } catch (error) {
      toast.error('Fehler beim Suchen nach Matches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    onMatch(match.invoice_id);
    toast.success('✅ Verknüpfung erstellt');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleFindMatches}
          disabled={loading}
          className="gap-2 flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Suche...
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Auto-Match
            </>
          )}
        </Button>
      </div>

      {matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Mögliche Rechnungen:</p>
          {matches.map((match) => (
            <Card 
              key={match.invoice_id}
              className={`cursor-pointer transition ${
                selectedMatch?.invoice_id === match.invoice_id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-slate-400'
              }`}
              onClick={() => handleSelectMatch(match)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{match.recipient}</p>
                    <p className="text-xs text-slate-500">€{match.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(match.confidence * 100)}%
                    </Badge>
                    {selectedMatch?.invoice_id === match.invoice_id && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}