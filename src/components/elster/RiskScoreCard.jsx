import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RiskScoreCard({ submissionId }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateRisk = async () => {
      try {
        const response = await base44.functions.invoke('calculateRiskScore', {
          submission_id: submissionId
        });

        if (response.data.success) {
          setRisk(response.data.result);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    calculateRisk();
  }, [submissionId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!risk) return null;

  const colorMap = {
    LOW: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle },
    MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle },
    HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle }
  };

  const colors = colorMap[risk.risk_level];
  const Icon = colors.icon;

  return (
    <Card className={`${colors.border} ${colors.bg}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
          <Icon className="w-5 h-5" />
          Risiko-Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{risk.risk_score}</span>
          <Badge variant={risk.risk_level === 'HIGH' ? 'destructive' : 'secondary'}>
            {risk.risk_level}
          </Badge>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              risk.risk_level === 'HIGH' ? 'bg-red-600' :
              risk.risk_level === 'MEDIUM' ? 'bg-yellow-600' :
              'bg-green-600'
            }`}
            style={{ width: `${Math.min(risk.risk_score, 100)}%` }}
          />
        </div>

        {risk.risk_factors.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Risikofaktoren:</div>
            {risk.risk_factors.map((factor, idx) => (
              <div key={idx} className="text-xs bg-white p-2 rounded border">
                <div className="flex items-center justify-between">
                  <span>{factor.factor}</span>
                  <Badge variant="outline" className="text-xs">+{factor.impact}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-600 pt-2 border-t">
          {risk.recommendation}
        </div>
      </CardContent>
    </Card>
  );
}