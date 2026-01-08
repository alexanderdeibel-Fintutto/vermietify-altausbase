import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PreSubmissionCheck({ submission, onSubmit }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    performCheck();
  }, [submission.id]);

  const performCheck = async () => {
    setChecking(true);
    try {
      const response = await base44.functions.invoke('preValidateSubmission', {
        submission_id: submission.id
      });

      if (response.data.success) {
        setResult(response.data.result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Einreichungs-Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className={`p-3 rounded-lg border ${result.can_submit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {result.can_submit ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${result.can_submit ? 'text-green-900' : 'text-red-900'}`}>
              {result.can_submit ? 'Bereit zur Einreichung' : 'Nicht einreichbar'}
            </span>
          </div>
        </div>

        {/* Blockers */}
        {result.blockers.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-600">Kritische Probleme</div>
            {result.blockers.map((blocker, idx) => (
              <Alert key={idx} className="bg-red-50 border-red-300">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{blocker.message}</div>
                      <div className="text-xs text-slate-600 mt-1">{blocker.category}</div>
                    </div>
                  </div>
                  <div className="text-xs mt-2 p-2 bg-white rounded border">
                    → {blocker.action}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-yellow-600">Warnungen</div>
            {result.warnings.map((warning, idx) => (
              <Alert key={idx} className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <div className="font-medium">{warning.message}</div>
                  <div className="text-xs mt-1">→ {warning.action}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && result.can_submit && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-blue-600">Empfehlungen</div>
            {result.recommendations.map((rec, idx) => (
              <div key={idx} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                💡 {rec.message} → {rec.action}
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        {result.can_submit && onSubmit && (
          <Button 
            onClick={onSubmit} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Jetzt einreichen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}