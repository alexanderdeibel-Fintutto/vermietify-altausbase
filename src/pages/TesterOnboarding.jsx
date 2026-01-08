import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';

export default function TesterOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Account erstellen', description: 'Registrieren Sie sich als Tester', completed: true },
    { title: 'Einladung akzeptieren', description: 'Akzeptieren Sie die Test-Einladung', completed: true },
    { title: 'Test-Konto einrichten', description: 'Erstellen Sie ein Test-Konto', completed: false },
    { title: 'Erste Aufgabe', description: 'Führen Sie Ihre erste Test-Aufgabe durch', completed: false },
    { title: 'Feedback einreichen', description: 'Reichen Sie Ihr erstes Feedback ein', completed: false },
  ];

  const testAccounts = [
    { type: 'Admin', email: 'admin@test.example.com', password: '••••••••' },
    { type: 'User', email: 'user@test.example.com', password: '••••••••' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🎯 Tester Onboarding</h1>
        <p className="text-slate-600 mt-1">Schritt-für-Schritt Anleitung zum Testen</p>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle>Fortschritt: {currentStep + 1}/{steps.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              idx === currentStep
                ? 'border-blue-500 bg-blue-50'
                : idx < currentStep
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 bg-white'
            }`}
            onClick={() => setCurrentStep(idx)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {idx < currentStep ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <p className="font-semibold text-slate-900">Schritt {idx + 1}: {step.title}</p>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
              {idx === currentStep && <ChevronRight className="w-5 h-5 text-blue-600" />}
            </div>
          </div>
        ))}
      </div>

      {currentStep === 2 && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Test-Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testAccounts.map((account, idx) => (
              <div key={idx} className="p-3 bg-white border border-blue-200 rounded-lg">
                <p className="font-semibold text-slate-900">{account.type} Account</p>
                <p className="text-sm text-slate-600">Email: {account.email}</p>
                <p className="text-sm text-slate-600">Passwort: {account.password}</p>
              </div>
            ))}
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setCurrentStep(3)}>
              Konten einrichten
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Erste Test-Aufgabe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900 mb-2">Aufgabe: Navigation testen</p>
              <ol className="text-sm text-slate-700 list-decimal list-inside space-y-1">
                <li>Melden Sie sich mit dem Admin-Konto an</li>
                <li>Navigieren Sie durch alle Hauptmenüpunkte</li>
                <li>Überprüfen Sie auf Fehler oder fehlende Links</li>
                <li>Notieren Sie alle Probleme</li>
              </ol>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setCurrentStep(4)}>
              Aufgabe abgeschlossen
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card className="border border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Feedback einreichen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">Nutzen Sie den "Problem melden" Button in der App um Ihr Feedback einzureichen.</p>
            <Button className="w-full bg-green-600 hover:bg-green-700">Problem melden</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}