import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function TerminationManager() {
  const [loading, setLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState(null);

  const { data: terminations = [], refetch } = useQuery({
    queryKey: ['terminations'],
    queryFn: () => base44.entities.TerminationNotice.list()
  });

  const handleGenerateLetter = async (terminationId) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateTerminationLetter', {
        terminationNoticeId: terminationId
      });
      setGeneratedLetter(response.data);
      toast.success('Kündigungsbrief generiert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    DRAFTED: 'bg-yellow-50 border-yellow-200',
    SERVED: 'bg-blue-50 border-blue-200',
    ACCEPTED: 'bg-green-50 border-green-200',
    CHALLENGED: 'bg-red-50 border-red-200',
    COMPLETED: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kündigungsverwaltung</h1>
        <p className="text-gray-600 mt-1">Alle Kündigungen verwalten</p>
      </div>

      <div className="space-y-3">
        {terminations.length > 0 ? (
          terminations.map(term => {
            const daysToTermination = Math.floor((new Date(term.termination_date) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={term.id} className={`border ${statusColors[term.status]}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">Kündigung eingereicht von {term.initiated_by}</p>
                      <p className="text-sm text-gray-600">
                        Kündigungsfrist: {term.notice_period} Tage • Kündigungsstichtag: {new Date(term.termination_date).toLocaleDateString('de-DE')}
                      </p>
                      {daysToTermination > 0 && (
                        <p className="text-xs text-amber-700 mt-1">
                          ⏰ {daysToTermination} Tage verbleibend
                        </p>
                      )}
                      {daysToTermination <= 0 && term.status !== 'COMPLETED' && (
                        <p className="text-xs text-red-700 mt-1">
                          ⚠ Kündigungsfrist abgelaufen - Übergabe ausstehend
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateLetter(term.id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        <FileText className="w-3 h-3 mr-1" />
                        Brief
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              Keine Kündigungen vorhanden
            </CardContent>
          </Card>
        )}
      </div>

      {generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle>Generierter Kündigungsbrief</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded p-4 max-h-96 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: generatedLetter.letter_html }} className="text-sm text-gray-800" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}