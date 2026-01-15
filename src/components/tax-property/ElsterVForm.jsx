import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ElsterVForm({ anlageVId, buildingId, taxYear }) {
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [xmlPreview, setXmlPreview] = useState('');

  useEffect(() => {
    loadSubmission();
  }, [anlageVId]);

  const loadSubmission = async () => {
    try {
      const submissions = await base44.entities.ElsterSubmission.filter({
        anlage_v_id: anlageVId,
        tax_year: taxYear
      });
      if (submissions.length) {
        setSubmission(submissions[0]);
        setXmlPreview(submissions[0].xml_content);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateElsterV', {
        anlageVId,
        buildingId,
        taxYear
      });
      
      setXmlPreview(response.data.xml);
      setSubmission(prev => ({
        ...prev,
        status: 'VALIDATED',
        xml_content: response.data.xml
      }));
      
      toast.success('ElsterV XML generiert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadXML = () => {
    const element = document.createElement('a');
    const file = new Blob([xmlPreview], { type: 'application/xml' });
    element.href = URL.createObjectURL(file);
    element.download = `AnlageV_${taxYear}.xml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('XML heruntergeladen');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ELSTER XML Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Generiert die XML-Datei für die Einreichung bei ELSTER (Steuererklärung online).
          </p>

          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              XML generieren
            </Button>
            {submission && submission.status === 'VALIDATED' && (
              <>
                <Button onClick={handleDownloadXML} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  XML Download
                </Button>
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Validiert</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* XML Preview */}
      {xmlPreview && (
        <Card>
          <CardHeader>
            <CardTitle>XML Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-64 text-xs">
              {xmlPreview}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Status Info */}
      {submission && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {submission.status}</p>
              {submission.submission_date && (
                <p><span className="font-medium">Eingereicht:</span> {new Date(submission.submission_date).toLocaleDateString('de-DE')}</p>
              )}
              {submission.reference_number && (
                <p><span className="font-medium">Referenznummer:</span> {submission.reference_number}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}