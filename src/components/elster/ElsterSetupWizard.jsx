import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Upload, TestTube } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ElsterSetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [certData, setCertData] = useState({
    certificate_name: '',
    certificate_file: null,
    certificate_password: '',
    certificate_type: 'TEST',
    tax_number: ''
  });
  const [certificateId, setCertificateId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCertData({ ...certData, certificate_file: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    try {
      const response = await base44.functions.invoke('uploadElsterCertificate', {
        ...certData,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (response.data.success) {
        setCertificateId(response.data.certificate_id);
        setTestResult(response.data.test_result);
        toast.success('Zertifikat hochgeladen');
        setStep(2);
      }
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
    }
  };

  const finishSetup = () => {
    toast.success('ELSTER-Integration erfolgreich eingerichtet!');
    onComplete?.();
  };

  const progress = (step / 2) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">ELSTER-Integration einrichten</h2>
        <Progress value={progress} className="h-2" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Schritt 1: Zertifikat hochladen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Zertifikat-Name</Label>
              <Input
                placeholder="z.B. Test-Zertifikat 2024"
                value={certData.certificate_name}
                onChange={(e) => setCertData({ ...certData, certificate_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Zertifikat-Datei (.pfx)</Label>
              <Input
                type="file"
                accept=".pfx,.p12"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <Label>Passwort</Label>
              <Input
                type="password"
                value={certData.certificate_password}
                onChange={(e) => setCertData({ ...certData, certificate_password: e.target.value })}
              />
            </div>

            <div>
              <Label>Steuernummer</Label>
              <Input
                placeholder="z.B. 1096081508187"
                value={certData.tax_number}
                onChange={(e) => setCertData({ ...certData, tax_number: e.target.value })}
              />
            </div>

            <Button onClick={handleUpload} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Hochladen & Testen
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Schritt 2: Verbindung getestet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult?.success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-600 mb-2">Verbindung erfolgreich!</h3>
                <p className="text-slate-600">ELSTER-Server erreichbar</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-slate-600">Antwortzeit</div>
                    <div className="font-bold">{testResult.response_time_ms}ms</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-slate-600">Zertifikat läuft ab</div>
                    <div className="font-bold">{testResult.certificate_expires_in_days} Tage</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <TestTube className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-600 mb-2">Verbindung fehlgeschlagen</h3>
                <p className="text-slate-600">{testResult?.error_message}</p>
              </div>
            )}

            <Button onClick={finishSetup} className="w-full">
              Einrichtung abschließen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}