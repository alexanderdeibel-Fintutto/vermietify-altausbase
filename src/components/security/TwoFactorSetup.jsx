import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TwoFactorSetup({ open, onOpenChange }) {
  const [step, setStep] = useState(1); // 1: Generate QR, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      // Mock: In real app, backend generates QR code and secret
      const mockSecret = Math.random().toString(36).substring(7);
      const mockQR = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/FinX?secret=${mockSecret}`;
      
      setSecret(mockSecret);
      setQrCode(mockQR);
      toast.success('✅ QR-Code generiert');
      setStep(2);
    } catch (error) {
      toast.error('Fehler beim Generieren');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyCode.length !== 6) {
      toast.error('Code muss 6 Ziffern haben');
      return;
    }

    setLoading(true);
    try {
      // Mock: Verify the code
      const mockCodes = [
        `BACKUP-${Math.random().toString(36).substring(7).toUpperCase()}`,
        `BACKUP-${Math.random().toString(36).substring(7).toUpperCase()}`,
        `BACKUP-${Math.random().toString(36).substring(7).toUpperCase()}`,
        `BACKUP-${Math.random().toString(36).substring(7).toUpperCase()}`,
        `BACKUP-${Math.random().toString(36).substring(7).toUpperCase()}`
      ];

      setBackupCodes(mockCodes);
      toast.success('✅ 2FA aktiviert');
      setStep(3);
    } catch (error) {
      toast.error('Ungültiger Code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Kopiert');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zwei-Faktor-Authentifizierung</DialogTitle>
        </DialogHeader>

        {/* Step 1: QR Code */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Installieren Sie eine Authentifizierungs-App (Google Authenticator, Authy, etc.)
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerateQR}
              disabled={loading}
              className="w-full gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR-Code generieren
            </Button>
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="border p-2 rounded" />
              </div>
            )}

            <div>
              <p className="text-sm text-slate-600 mb-2">Oder manuell eingeben:</p>
              <code className="block bg-slate-50 p-2 rounded text-center font-mono text-sm break-all">
                {secret}
              </code>
            </div>

            <div>
              <label className="text-sm font-medium">6-stelliger Code aus App</label>
              <Input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={verifyCode.length !== 6 || loading}
              className="w-full"
            >
              {loading ? 'Verifiziere...' : 'Bestätigen'}
            </Button>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div className="space-y-4">
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800 text-sm">
                ✅ 2FA ist jetzt aktiviert
              </AlertDescription>
            </Alert>

            <div>
              <p className="text-sm font-medium mb-2">Backup-Codes (speichern Sie diese!):</p>
              <div className="bg-slate-50 p-3 rounded space-y-2 max-h-48 overflow-y-auto">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between font-mono text-sm p-2 hover:bg-slate-100 rounded cursor-pointer"
                    onClick={() => copyToClipboard(code)}
                  >
                    <span>{code}</span>
                    <Copy className="w-3 h-3 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fertig
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}