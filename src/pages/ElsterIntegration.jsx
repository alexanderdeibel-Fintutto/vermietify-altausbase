import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Check, AlertTriangle, Upload, Download, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import QuickStats from '@/components/shared/QuickStats';
import ElsterSubmitPanel from '@/components/elster/ElsterSubmitPanel';

export default function ElsterIntegrationPage() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const { data: elsterSubmissions = [] } = useQuery({
    queryKey: ['elsterSubmissions'],
    queryFn: () => base44.entities.ElsterSubmission.list()
  });

  const stats = [
    { label: 'Eingereichte Formulare', value: elsterSubmissions.filter(s => s.status === 'SUBMITTED').length },
    { label: 'Akzeptiert', value: elsterSubmissions.filter(s => s.status === 'ACCEPTED').length },
    { label: 'Im Entwurf', value: elsterSubmissions.filter(s => s.status === 'DRAFT').length },
    { label: 'Fehler', value: elsterSubmissions.filter(s => s.status === 'REJECTED').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">ELSTER Integration</h1>
          <p className="text-sm font-extralight text-slate-400 mt-1">Direktes Einreichen von Steuerformularen an ELSTER</p>
        </div>
        <Button className="bg-slate-700 hover:bg-slate-800 font-extralight"><Upload className="w-4 h-4 mr-2" />Zum ELSTER einreichen</Button>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Das ELSTER-Zertifikat läuft am 31.12.2026 ab. Bitte erneuern Sie es rechtzeitig.
        </AlertDescription>
      </Alert>

      <QuickStats stats={stats} accentColor="red" />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Zertifikat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">Status: Aktiv ✓</p>
              <p className="text-xs text-slate-600">Gültig bis: 31.12.2026</p>
            </div>
            <Button variant="outline" className="w-full">🔄 Zertifikat erneuern</Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Verbindung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">Verbunden ✓</p>
              <p className="text-xs text-slate-600">Letzter Test: Heute 10:30</p>
            </div>
            <Button variant="outline" className="w-full">🧪 Verbindung testen</Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-slate-900">Einreichungshistorie</h2>
        {elsterSubmissions.length > 0 ? (
          elsterSubmissions.map((sub, idx) => {
            const statusColors = {
              DRAFT: 'bg-slate-600',
              VALIDATED: 'bg-blue-600',
              SUBMITTED: 'bg-orange-600',
              ACCEPTED: 'bg-green-600',
              REJECTED: 'bg-red-600'
            };
            const statusLabels = {
              DRAFT: '📝 Entwurf',
              VALIDATED: '✓ Validiert',
              SUBMITTED: '📤 Eingereicht',
              ACCEPTED: '✅ Akzeptiert',
              REJECTED: '❌ Abgelehnt'
            };

            return (
              <Card key={idx} className="border border-slate-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSubmission(sub)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-slate-900">Anlage V {sub.tax_year}</h3>
                        <Badge className={statusColors[sub.status] || 'bg-slate-600'}>
                          {statusLabels[sub.status] || sub.status}
                        </Badge>
                      </div>
                      {sub.reference_number && (
                        <p className="text-xs text-slate-600 ml-8">Referenz: {sub.reference_number} • {new Date(sub.submission_date).toLocaleDateString('de-DE')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {sub.status === 'VALIDATED' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(sub);
                        }}>
                          <Send className="w-4 h-4 mr-1" />
                          Einreichen
                        </Button>
                      )}
                      <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border border-slate-200">
            <CardContent className="pt-6 text-center text-slate-600">
              Noch keine Einreichungen. Erstellen Sie zuerst eine <strong>Anlage V</strong>.
            </CardContent>
          </Card>
        )}
      </div>

      {selectedSubmission && selectedSubmission.status === 'VALIDATED' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ELSTER Einreichung</CardTitle>
              <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </CardHeader>
            <CardContent>
              <ElsterSubmitPanel submission={selectedSubmission} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}