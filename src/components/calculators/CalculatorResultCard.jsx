import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Save } from 'lucide-react';

export default function CalculatorResultCard({ 
  primaryLabel, 
  primaryValue, 
  secondaryResults = [],
  breakdown = [],
  actions = true
}) {
  return (
    <Card className="vf-calculator-result-panel">
      <CardContent className="p-6">
        <div className="vf-calculator-primary-result">
          <div className="vf-calculator-primary-label">{primaryLabel}</div>
          <div className="vf-calculator-primary-value">{primaryValue}</div>
        </div>

        {secondaryResults.length > 0 && (
          <div className="vf-calculator-secondary-results">
            {secondaryResults.map((item, index) => (
              <div key={index} className="vf-calculator-secondary-item">
                <div className="vf-calculator-secondary-label">{item.label}</div>
                <div className="vf-calculator-secondary-value">{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {breakdown.length > 0 && (
          <div className="vf-calculator-breakdown">
            <div className="vf-calculator-breakdown-title">Details</div>
            {breakdown.map((item, index) => (
              <div key={index} className="vf-calculator-breakdown-item">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {actions && (
          <div className="flex gap-2 mt-6">
            <Button variant="outline" size="sm" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Teilen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}