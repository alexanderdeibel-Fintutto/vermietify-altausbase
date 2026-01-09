import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function MatchSuggestions({ item, selectedMatch, onSelectMatch }) {
  if (!item.match_candidates || item.match_candidates.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Keine Match-Kandidaten gefunden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Kein passendes Dokument im System gefunden. Sie können ein neues erstellen oder manuell zuordnen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          🔗 Match-Vorschläge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedMatch} onValueChange={onSelectMatch}>
          {item.match_candidates.map((candidate, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedMatch === candidate.entity_id
                  ? 'border-green-400 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={candidate.entity_id} id={`match-${idx}`} />
                <Label
                  htmlFor={`match-${idx}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="mb-2">
                    <p className="font-medium text-sm">
                      {candidate.entity_type} #{candidate.entity_id?.substring(0, 8)}
                    </p>
                    <Badge className="mt-1 bg-green-100 text-green-800">
                      {candidate.confidence}% Match
                    </Badge>
                  </div>
                  
                  {/* Confidence Bar */}
                  <Progress value={candidate.confidence} className="h-2 mb-2" />
                  
                  {/* Matched Fields */}
                  {candidate.details?.matched_on && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-medium">Übereinstimmungen:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {candidate.details.matched_on.map((field, i) => (
                          <li key={i}>✓ {field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Label>
              </div>
            </div>
          ))}

          {/* Neue Entity Option */}
          <div
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedMatch === 'new'
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="new" id="match-new" />
              <Label htmlFor="match-new" className="cursor-pointer font-medium text-sm">
                ✨ Neue {item.document_type === 'invoice' ? 'Rechnung' : 'Entity'} erstellen
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}