import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function AICategorizationCard({ invoice, suggestion, onAccept, onReject }) {
  if (!suggestion) return null;

  const confidenceColor = 
    suggestion.confidence >= 90 ? 'bg-green-100 text-green-800' :
    suggestion.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
    'bg-orange-100 text-orange-800';

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="w-5 h-5" />
          KI-Kategorisierung
          <Badge className={confidenceColor}>
            {suggestion.confidence}% sicher
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white rounded-lg">
          <div className="font-semibold text-slate-900 mb-1">
            {suggestion.category_details?.display_name || suggestion.suggested_category_code}
          </div>
          <p className="text-sm text-slate-600 mb-3">
            {suggestion.reasoning}
          </p>
          
          {suggestion.category_details && (
            <div className="space-y-1 text-xs text-slate-500">
              <div>• Behandlung: {suggestion.category_details.tax_treatment}</div>
              {suggestion.category_details.allocatable && (
                <div>• ✓ Umlagefähig nach BetrKV</div>
              )}
              {suggestion.tax_implications && (
                <div>• Steuerlich: {suggestion.tax_implications.deductible ? 'Absetzbar' : 'Nicht absetzbar'}</div>
              )}
            </div>
          )}
        </div>

        {suggestion.alternative_categories?.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Alternative Vorschläge:</div>
            <div className="space-y-2">
              {suggestion.alternative_categories.map((alt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onAccept?.(alt.category_code)}
                >
                  <span className="flex-1 text-left">{alt.category_code}</span>
                  <Badge variant="secondary" className="text-xs">
                    {alt.confidence}%
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onAccept?.(suggestion.suggested_category_code)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Übernehmen
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1"
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Ablehnen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}