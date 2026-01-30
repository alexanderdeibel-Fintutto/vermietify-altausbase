import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, BarChart3, Users, FileText, Bot, Settings } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: BarChart3,
      title: 'Abrechnungen',
      description: 'Verwalten Sie Betriebskostenabrechnungen',
      path: 'OperatingCosts'
    },
    {
      icon: Users,
      title: 'Mieterportal',
      description: 'Kommunizieren Sie mit Ihren Mietern',
      path: 'TenantPortalManagement'
    },
    {
      icon: FileText,
      title: 'Vertragsanalyse',
      description: 'Analysieren Sie Ihre Verträge mit KI',
      path: 'ContractAnalysis'
    },
    {
      icon: Bot,
      title: 'Dokument-KI',
      description: 'KI-gestützte Dokumentenverarbeitung',
      path: 'DocumentAI'
    },
    {
      icon: FileText,
      title: 'Vertrags-Tasks',
      description: 'Verwalten Sie Vertragsaufgaben',
      path: 'ContractTasksView'
    },
    {
      icon: Settings,
      title: 'KI-Settings',
      description: 'Konfigurieren Sie KI-Funktionen',
      path: 'AISettings'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen zu NK-Abrechnung
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Ihr intelligentes System für Immobilienverwaltung und Betriebskostenabrechnungen
          </p>
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Zum Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.path}
                to={createPageUrl(feature.path)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Über diese Plattform
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            NK-Abrechnung ist eine moderne Lösung für Immobilienverwalter und Eigentümer zur Verwaltung von Betriebskostenabrechnungen mit KI-Funktionalität.
          </p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              Intelligente Dokumentenverarbeitung mit KI
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              Mieterportal für direkte Kommunikation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              Automatische Vertragsanalyse
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              Umfassende Reporting-Tools
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}