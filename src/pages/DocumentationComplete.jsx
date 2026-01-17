import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Book, Code, Database, FileText, Users, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DocumentationComplete() {
  const sections = [
    {
      title: 'Prompts #1-10: Foundation',
      icon: Code,
      status: 'complete',
      items: ['Design Tokens', 'Farbsystem', 'Typografie', 'Spacing', 'Effekte']
    },
    {
      title: 'Prompts #11-16: UI Components',
      icon: FileText,
      status: 'complete',
      items: ['Buttons', 'Inputs', 'Cards', 'Tables', 'Badges', 'Dialogs']
    },
    {
      title: 'Prompts #17-21: Templates',
      icon: Workflow,
      status: 'complete',
      items: ['Calculator', 'Wizard', 'Quiz', 'Generator', 'List Pages', 'Marketing']
    },
    {
      title: 'Prompts #22-27: Complete App',
      icon: Database,
      status: 'complete',
      items: [
        'Detail Pages (Building, Unit, Tenant, Contract)',
        'Dashboards (Vermieter, Mieter, Admin, StB)',
        'Workflows (BK-Wizard, Anlage V, Mietvertrag)',
        'Onboarding Wizard',
        'Settings & Profile',
        'Error Pages (404, 500, Offline)',
        'Notifications & Activity Feed',
        'Backend Functions (Lead Capture, Calculators, PDF)',
        'Entity Schemas (Lead, Quiz, VPI, etc.)'
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--vf-success-100)] mb-4">
          <CheckCircle className="h-10 w-10 text-[var(--vf-success-600)]" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Vermitify Design System - Komplett!</h1>
        <p className="text-xl text-[var(--theme-text-secondary)]">
          Alle 27 Prompts wurden erfolgreich implementiert
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--vf-gradient-primary)] flex items-center justify-center text-white">
                    <SectionIcon className="h-5 w-5" />
                  </div>
                  {section.title}
                  <span className="vf-badge vf-badge-success ml-auto">
                    ✓ Komplett
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-[var(--vf-success-500)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-[var(--vf-primary-50)] rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Was wurde implementiert?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div>
            <div className="text-3xl font-bold text-[var(--vf-primary-600)]">150+</div>
            <div className="text-sm text-[var(--theme-text-secondary)]">CSS-Klassen</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--vf-primary-600)]">50+</div>
            <div className="text-sm text-[var(--theme-text-secondary)]">React-Komponenten</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--vf-primary-600)]">5</div>
            <div className="text-sm text-[var(--theme-text-secondary)]">Themes</div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <Link to={createPageUrl('VermitifyDesignShowcase')}>
          <Button variant="gradient">
            Design System Demo
          </Button>
        </Link>
        <Link to={createPageUrl('VermitifyHomepage')}>
          <Button variant="outline">
            Marketing Homepage
          </Button>
        </Link>
        <Link to={createPageUrl('VermitifyToolsOverview')}>
          <Button variant="outline">
            Tool-Übersicht
          </Button>
        </Link>
      </div>
    </div>
  );
}