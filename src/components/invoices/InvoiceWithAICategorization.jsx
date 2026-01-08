import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import AICategorizationCard from '@/components/elster/AICategorizationCard';

export default function InvoiceWithAICategorization({ buildingId, onSave }) {
  const [invoiceData, setInvoiceData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    kategorie: ''
  });
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWithAI = async () => {
    if (!invoiceData.description || !invoiceData.amount) {
      toast.error('Bitte Beschreibung und Betrag eingeben');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await base44.functions.invoke('categorizeExpenseWithAI', {
        invoice_data: {
          description: invoiceData.description,
          amount: parseFloat(invoiceData.amount)
        },
        building_ownership: 'VERMIETUNG',
        legal_form: 'PRIVATPERSON',
        building_id: buildingId
      });

      if (response.data.success) {
        setAiSuggestion(response.data.suggestion);
      }
    } catch (error) {
      toast.error('KI-Analyse fehlgeschlagen');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAccept = (categoryCode) => {
    setInvoiceData(prev => ({ ...prev, kategorie: categoryCode }));
    toast.success('Kategorie übernommen');
  };

  const handleSave = async () => {
    if (!invoiceData.kategorie) {
      toast.error('Bitte Kategorie wählen');
      return;
    }

    try {
      await base44.entities.FinancialItem.create({
        building_id: buildingId,
        description: invoiceData.description,
        betrag: parseFloat(invoiceData.amount),
        datum: invoiceData.date,
        kategorie: invoiceData.kategorie,
        typ: 'expense'
      });

      toast.success('Rechnung gespeichert');
      onSave?.();
      
      // Reset
      setInvoiceData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        kategorie: ''
      });
      setAiSuggestion(null);
    } catch (error) {
      toast.error('Speichern fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Neue Rechnung mit KI-Kategorisierung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={invoiceData.description}
              onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
              placeholder="z.B. Grundsteuerbescheid 2024"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Betrag (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={invoiceData.amount}
                onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                value={invoiceData.date}
                onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={analyzeWithAI}
            disabled={isAnalyzing || !invoiceData.description || !invoiceData.amount}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isAnalyzing ? 'KI analysiert...' : 'Mit KI kategorisieren'}
          </Button>
        </CardContent>
      </Card>

      {aiSuggestion && (
        <AICategorizationCard
          invoice={invoiceData}
          suggestion={aiSuggestion}
          onAccept={handleAccept}
          onReject={() => setAiSuggestion(null)}
        />
      )}

      {invoiceData.kategorie && (
        <Button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Rechnung speichern
        </Button>
      )}
    </div>
  );
}