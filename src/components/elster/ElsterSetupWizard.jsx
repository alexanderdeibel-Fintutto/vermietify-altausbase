import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Upload, TestTube, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ElsterSetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [certificateFile, setCertificateFile] = useState(null);
  const [password, setPassword] = useState('');
  const [certificateType, setCertificateType] = useState('TEST');
  const [taxNumber, setTaxNumber] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [certificateId, setCertificateId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const progress = (step / 3) * 100;

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificate_file', certificateFile);
      formData.append('password', password);
      formData.append('certificate_type', certificateType);
      formData.append('tax_number', taxNumber);
      formData.append('certificate_name', certificateName);

      const response = await base44.functions.invoke('uploadElsterCertificate', formData);

      if (response.data.success) {
        setCertificateId(response.data.certificate_id);
        toast.success('Zertifikat hochgeladen');
        setStep(2);
      }
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const response = await base44.functions.invoke('testElsterConnection', {
        certificate_id: certificateId
      });

      if (response.data.success) {
        setTestResult(response.data.test_result);
        toast.success('Verbindungstest erfolgreich!');
        setStep(3);
      }
    } catch (error) {
      toast.error('Verbindungstest fehlgeschlagen');
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = async () => {
    // Templates und Kategorien initialisieren
    try {
      await base44.functions.invoke('seedElsterFormTemplates', { year: new Date().getFullYear() });
      await base44.functions.invoke('seedTaxCategoryMaster', {});
      
      toast.success('ELSTER-Integration eingerichtet!');
      onComplete?.();
    } catch (error) {
      toast.error('Initialisierung fehlgeschlagen');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-slate-600">
          <span>Schritt {step} von 3</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Zertifikat hochladen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Zertifikat-Name</Label>
                  <Input
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder="z.B. Produktiv-Zertifikat 2025"
                  />
                </div>

                <div>
                  <Label>Typ</Label>
                  <Select value={certificateType} onValueChange={setCertificateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEST">🧪 Test-Zertifikat</SelectItem>
                      <SelectItem value="PRODUCTION">🏛️ Produktiv-Zertifikat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Steuernummer</Label>
                  <Input
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="z.B. 1096081508187"
                  />
                </div>

                <div>
                  <Label>Zertifikat-Datei (.pfx oder .p12)</Label>
                  <Input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={(e) => setCertificateFile(e.target.files?.[0])}
                  />
                </div>

                <div>
                  <Label>Passwort</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !certificateFile || !password || !taxNumber}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isUploading ? 'Wird hochgeladen...' : 'Hochladen & Weiter'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Verbindung testen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Wir testen jetzt die Verbindung zur ELSTER-{certificateType === 'TEST' ? 'Test' : 'Produktiv'}umgebung.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isTesting ? 'Teste Verbindung...' : 'Verbindung testen'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && testResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Einrichtung abschließen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    {testResult.message}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Zertifikat gültig:</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ELSTER erreichbar:</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Steuernummer gültig:</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Einrichtung abschließen
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}