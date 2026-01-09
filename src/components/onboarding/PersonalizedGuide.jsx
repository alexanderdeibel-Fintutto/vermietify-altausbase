import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Video, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const GUIDE_SECTIONS = [
  {
    id: 'getting_started',
    title: 'Erste Schritte',
    icon: '🚀',
    description: 'Lern die Grundlagen des Portals'
  },
  {
    id: 'payments',
    title: 'Zahlungen',
    icon: '💳',
    description: 'Verwaltung von Mietzahlungen'
  },
  {
    id: 'maintenance',
    title: 'Wartung',
    icon: '🔧',
    description: 'Wartungsanfragen einreichen'
  },
  {
    id: 'documents',
    title: 'Dokumente',
    icon: '📄',
    description: 'Zugriff auf wichtige Dokumente'
  },
  {
    id: 'communication',
    title: 'Kommunikation',
    icon: '💬',
    description: 'Mit dem Verwaltungsteam kommunizieren'
  }
];

export default function PersonalizedGuide({ tenantData, tenantType = 'residential', onGuideComplete }) {
  const [selectedGuide, setSelectedGuide] = useState('getting_started');
  const [guideContent, setGuideContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readGuides, setReadGuides] = useState(new Set());

  const generatePersonalizedGuide = async (section) => {
    setIsLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a personalized, beginner-friendly guide for a ${tenantType} tenant about "${GUIDE_SECTIONS.find(s => s.id === section)?.title}". 
The tenant is ${tenantData.full_name}. 
Make it practical, step-by-step, with clear instructions. Include tips and common questions.
Format in markdown with sections and bullet points.`,
        response_json_schema: {
          type: 'object',
          properties: {
            guide: { type: 'string' },
            tips: { type: 'array', items: { type: 'string' } },
            faq: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setGuideContent(response);
      const newRead = new Set(readGuides);
      newRead.add(section);
      setReadGuides(newRead);
      if (newRead.size === GUIDE_SECTIONS.length) {
        onGuideComplete?.();
      }
    } catch (error) {
      console.error('Error generating guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generatePersonalizedGuide(selectedGuide);
  }, [selectedGuide]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalisierte Guides</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Erfahren Sie, wie Sie alle Funktionen des Portals nutzen
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Guide Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {GUIDE_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedGuide(section.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedGuide === section.id
                  ? 'border-slate-700 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">{section.icon}</span>
              <p className="font-medium text-sm text-slate-900 mt-2">{section.title}</p>
              {readGuides.has(section.id) && (
                <p className="text-xs text-green-600 mt-1">✓ Gelesen</p>
              )}
            </button>
          ))}
        </div>

        {/* Guide Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        ) : guideContent ? (
          <Tabs defaultValue="content" className="w-full">
            <TabsList>
              <TabsTrigger value="content" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Inhalt
              </TabsTrigger>
              <TabsTrigger value="tips" className="gap-2">
                <Video className="w-4 h-4" />
                Tipps
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                {guideContent.guide && (
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {guideContent.guide}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-3">
              {guideContent.tips?.map((tip, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">💡 {tip}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="faq" className="space-y-3">
              {guideContent.faq?.map((item, index) => (
                <details key={index} className="p-3 border border-slate-200 rounded-lg group">
                  <summary className="cursor-pointer font-medium text-slate-900">
                    {item.question}
                  </summary>
                  <p className="text-sm text-slate-600 mt-3 pl-4 border-l-2 border-slate-200">
                    {item.answer}
                  </p>
                </details>
              ))}
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Completion Info */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          📚 Sie haben {readGuides.size} von {GUIDE_SECTIONS.length} Guides gelesen.
          {readGuides.size === GUIDE_SECTIONS.length && ' ✓ Alle Guides abgeschlossen!'}
        </div>
      </CardContent>
    </Card>
  );
}