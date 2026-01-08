import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionPredictionCard({ transaction, onCategorySelect }) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const handleGetPrediction = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('predictCategoryForTransaction', {
        transaction_id: transaction.id
      });

      if (response.data.prediction) {
        setPrediction(response.data.prediction);
      }
    } catch (error) {
      toast.error('Vorhersage fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {!prediction ? (
            <Button
              onClick={handleGetPrediction}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  KI-Vorschlag abrufen
                </>
              )}
            </Button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">KI-Vorschlag</p>
                  <p className="font-semibold text-slate-800">{prediction.category}</p>
                </div>
                <Badge className={getConfidenceColor(prediction.confidence)}>
                  {prediction.confidence}%
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{prediction.reason}</p>
              <Button
                onClick={() => onCategorySelect(prediction.category)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Übernehmen
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}