import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Bell, Phone, BarChart3, Settings, Users, Lightbulb, AlertCircle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function KommunikationDashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.TenantMessage?.list?.('-created_date', 20) || Promise.resolve([]),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement?.list?.('-created_date', 20) || Promise.resolve([]),
  });

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-slate-900">Kommunikations-Dashboard</h1>
        <p className="text-slate-600 font-light mt-2">
          Zentrale Verwaltung aller Kommunikationsformen mit Mietern und Stakeholdern
        </p>
      </div>

      {/* Quick Stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Neue Nachrichten</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{messages.filter(m => !m.is_read).length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Aktive Ankündigungen</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">{announcements.filter(a => a.is_active).length}</p>
                </div>
                <Bell className="w-8 h-8 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Support-Tickets</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">8</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Community Posts</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">3 ausstehend</p>
                </div>
                <Users className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Postversände</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">7 aktiv</p>
                </div>
                <Mail className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Ø Antwortzeit</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">1.9h</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Communication Channels */}
      <Tabs defaultValue="nachrichten" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="nachrichten">
            <MessageSquare className="w-4 h-4 mr-2" />
            Nachrichten
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="ankuendigungen">
                <Bell className="w-4 h-4 mr-2" />
                Ankündigungen
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                E-Mail
              </TabsTrigger>
              <TabsTrigger value="support">
                <Phone className="w-4 h-4 mr-2" />
                Support
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Nachrichten Tab */}
        <TabsContent value="nachrichten" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Direktnachrichten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">1:1 Kommunikation mit Mietern und Partnern</p>
                <Link to={createPageUrl('AdminMessagingCenter')}>
                  <Button className="w-full">Zu Direktnachrichten</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Mieter-Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Chat-Interface für Mieterkommunikation</p>
                <Link to={createPageUrl('TenantCommunicationCenter')}>
                  <Button className="w-full">Zum Mieter-Chat</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">WhatsApp Integration für Messaging</p>
                <Link to={createPageUrl('WhatsAppCommunication')}>
                  <Button className="w-full">WhatsApp-Verwaltung</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Beschwerde-Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Verwaltung von Mieterbeschwerden</p>
                <Link to={createPageUrl('AdminIssueReports')}>
                    <Button className="w-full">Zum Portal</Button>
                  </Link>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Users className="w-5 h-5" />
                   Community-Forum
                 </CardTitle>
                </CardHeader>
                <CardContent>
                 <p className="text-sm text-slate-600 mb-4">Mieter-Austausch und Gemeinschaftsposts</p>
                 <Link to={createPageUrl('CommunityForum')}>
                   <Button className="w-full">Zum Forum</Button>
                 </Link>
                </CardContent>
                </Card>
                </div>
                </TabsContent>

        {/* Ankündigungen Tab */}
        {isAdmin && (
          <TabsContent value="ankuendigungen" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Ankündigungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Ankündigungen für alle oder einzelne Mieter</p>
                  <Link to={createPageUrl('AdminAnnouncementCenter')}>
                    <Button className="w-full">Ankündigungen verwalten</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Massen-Versand
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Massennachrichten per E-Mail/SMS</p>
                  <Link to={createPageUrl('BulkMessaging')}>
                        <Button className="w-full">Massen-Versand</Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Postversand
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">LetterXpress Integration für Briefe</p>
                      <Link to={createPageUrl('LetterXpressManagement')}>
                        <Button className="w-full">Postversand verwalten</Button>
                      </Link>
                    </CardContent>
                  </Card>
                  </div>
                  </TabsContent>
                  )}

        {/* E-Mail Tab */}
        {isAdmin && (
          <TabsContent value="email" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    E-Mail-Vorlagen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Vordefinierte E-Mail-Templates</p>
                  <Link to={createPageUrl('EmailTemplates')}>
                    <Button className="w-full">Zu Vorlagen</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Nachrichtenvorlagen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Benutzerdefinierte Kommunikationsvorlagen</p>
                  <Link to={createPageUrl('CommunicationTemplates')}>
                    <Button className="w-full">Vorlagen verwalten</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Template-Verwaltung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Zentrale Verwaltung aller Templates</p>
                  <Link to={createPageUrl('EmailTemplateManager')}>
                        <Button className="w-full">Verwaltung</Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        KI-Generator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">KI-basierte Vorlagen-Generierung</p>
                      <Link to={createPageUrl('AITemplateGenerator')}>
                        <Button className="w-full">Vorlagen generieren</Button>
                      </Link>
                    </CardContent>
                  </Card>
                  </div>
                  </TabsContent>
                  )}

        {/* Support Tab */}
        {isAdmin && (
          <TabsContent value="support" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Support-Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Zentrales Support-Management</p>
                  <Link to={createPageUrl('SupportCenter')}>
                    <Button className="w-full">Support-Center</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Ticket-Verwaltung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Support Tickets und Anfragen</p>
                  <Link to={createPageUrl('SupportTicketManager')}>
                    <Button className="w-full">Tickets verwalten</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Feedback-Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Müterfeedback und Bewertungen</p>
                  <Link to={createPageUrl('TenantFeedbackManager')}>
                        <Button className="w-full">Feedback anzeigen</Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Wissensdatenbank
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">FAQs und Hilfeinhalte für Mieter</p>
                      <Link to={createPageUrl('KnowledgeBaseAdmin')}>
                        <Button className="w-full">Zur Wissensdatenbank</Button>
                      </Link>
                    </CardContent>
                  </Card>
                  </div>
                  </TabsContent>
                  )}

        {/* Analytics Tab */}
        {isAdmin && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Kommunikations-Analysen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Detaillierte Statistiken über alle Kanäle</p>
                  <Link to={createPageUrl('CommunicationAnalytics')}>
                    <Button className="w-full">Zur Analyse</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Automatisierte Kommunikation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">KI-gestützte Automatisierungen</p>
                  <Link to={createPageUrl('AutomatedCommunication')}>
                    <Button className="w-full">Automatisierungen</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Audit-Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Detaillierte Logs aller Events</p>
                  <Link to={createPageUrl('CommunicationAuditLog')}>
                    <Button className="w-full">Zum Audit-Log</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Benachrichtigungs-Verlauf
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Übersicht aller Versände</p>
                  <Link to={createPageUrl('NotificationHistory')}>
                    <Button className="w-full">Verlauf anzeigen</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}