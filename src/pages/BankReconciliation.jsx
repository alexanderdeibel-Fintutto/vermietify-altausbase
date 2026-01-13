import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Check, AlertCircle, RefreshCw } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';
import AIMatchSuggestions from '@/components/banking/AIMatchSuggestions';

export default function BankReconciliationPage() {
  const [reconciled, setReconciled] = useState(0);
  const [total, setTotal] = useState(12);

  const transactions = [
    { date: '2026-01-08', description: 'Mietzahlung - Meyer', amount: 1200, status: 'matched', booking: 'MIE-001' },
    { date: '2026-01-07', description: 'Versicherungsprämie', amount: 450, status: 'unmatched' },
    { date: '2026-01-05', description: 'Nebenkosten Zahlung', amount: 230, status: 'matched', booking: 'NK-001' },
    { date: '2026-01-03', description: 'Reparaturen', amount: 850, status: 'unmatched' },
  ];

  const stats = [
    { label: 'Gesamttransaktionen', value: total },
    { label: 'Abgestimmt', value: reconciled },
    { label: 'Offen', value: total - reconciled },
    { label: 'Genauigkeit', value: ((reconciled / total) * 100).toFixed(0) + '%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Bankabstimmung</h1>
          <p className="text-sm font-extralight text-slate-400 mt-1">Abstimmung von Banktransaktionen und Buchungen</p>
        </div>
        <Button className="bg-slate-700 hover:bg-slate-800 font-extralight"><RefreshCw className="w-4 h-4 mr-2" />Konten synchronisieren</Button>
      </div>

      <QuickStats stats={stats} accentColor="cyan" />

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="matched">Abgestimmt</TabsTrigger>
          <TabsTrigger value="unmatched">Offen</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {transactions.map((tx, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <CreditCard className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">{tx.description}</h3>
                      <Badge className={tx.status === 'matched' ? 'bg-green-600' : 'bg-orange-600'}>
                        {tx.status === 'matched' ? '✓ Abgestimmt' : 'Offen'}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600 ml-8">
                      <span>📅 {tx.date}</span>
                      <span>💶 {tx.amount.toLocaleString('de-DE')} €</span>
                      {tx.booking && <span>🔗 {tx.booking}</span>}
                    </div>
                  </div>
                  {tx.status === 'unmatched' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-800 font-extralight">
                        <Check className="w-4 h-4 mr-1" /> Zuordnen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matched" className="space-y-3">
          {transactions.filter(t => t.status === 'matched').map((tx, idx) => (
            <Card key={idx} className="border border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{tx.description}</p>
                    <p className="text-sm text-slate-600">{tx.date} • {tx.amount.toLocaleString('de-DE')} € • {tx.booking}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unmatched" className="space-y-3">
           {transactions.filter(t => t.status === 'unmatched').map((tx, idx) => (
             <div key={idx} className="space-y-2">
               <Card className="border border-orange-200 bg-orange-50">
                 <CardContent className="pt-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3 flex-1">
                       <AlertCircle className="w-5 h-5 text-orange-600" />
                       <div>
                         <p className="font-semibold text-slate-900">{tx.description}</p>
                         <p className="text-sm text-slate-600">{tx.date} • {tx.amount.toLocaleString('de-DE')} €</p>
                       </div>
                     </div>
                     <Button size="sm" className="bg-slate-700 hover:bg-slate-800 font-extralight">Zuordnen</Button>
                   </div>
                 </CardContent>
               </Card>
               <AIMatchSuggestions transaction={tx} />
             </div>
           ))}
         </TabsContent>
      </Tabs>
    </div>
  );
}