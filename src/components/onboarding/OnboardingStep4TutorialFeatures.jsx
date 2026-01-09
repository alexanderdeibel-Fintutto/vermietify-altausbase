import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Play, BookOpen, MessageSquare } from 'lucide-react';

export default function OnboardingStep4TutorialFeatures({ formData, setFormData }) {
  const features = [
    {
      id: 'tax_rules',
      title: 'Steuerregeln Verwaltung',
      description: 'Verwalten Sie Steuerregeln und -konfigurationen',
      icon: BookOpen,
      video: null
    },
    {
      id: 'chatbot',
      title: 'AI Steuerchatbot',
      description: 'Fragen Sie zur Steuersituation und erhalten Sie Antworten',
      icon: MessageSquare,
      video: null
    },
    {
      id: 'document_analysis',
      title: 'Dokumentenanalyse',
      description: 'Laden Sie Belege hoch und erhalten Sie Abzugsvorschläge',
      icon: BookOpen,
      video: null
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-slate-600 mb-6">
        Lernen Sie die Kernfunktionen kennen. Diese kurzen Tutorials zeigen die wichtigsten Features.
      </p>
      <div className="space-y-3">
        {features.map(feature => {
          const Icon = feature.icon;
          const isCompleted = formData.tutorial_completed; // Simplified for now
          return (
            <Card key={feature.id} className="p-4 border border-slate-200 hover:border-slate-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-2">
                  <Play className="w-3 h-3 mr-1" />
                  Video
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-4 bg-green-50 border border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Grundlagen verstanden?</p>
            <p className="text-sm text-green-800">Sie können jetzt zu den erweiterten Einstellungen übergehen.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}