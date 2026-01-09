import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell, Plus } from 'lucide-react';
import ConversationList from '@/components/tenant-communication/ConversationList';
import MessageThread from '@/components/tenant-communication/MessageThread';
import SendAnnouncementDialog from '@/components/tenant-communication/SendAnnouncementDialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TenantCommunicationCenterPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-slate-900">Mieter-Kommunikation</h1>
        <p className="text-slate-600 font-light mt-2">
          {isAdmin 
            ? 'Verwalten Sie Nachrichten und Mitteilungen für Ihre Mieter'
            : 'Kommunizieren Sie direkt mit Ihrer Verwaltung'
          }
        </p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Nachrichten
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="announcements">
              <Bell className="w-4 h-4 mr-2" />
              Ankündigungen
            </TabsTrigger>
          )}
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-light text-slate-900">Konversationen</h2>
                {!isAdmin && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <ConversationList 
                onSelectConversation={setSelectedConversation}
                userRole={currentUser?.role}
              />
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="h-full">
                  <MessageThread
                    conversationId={selectedConversation.id}
                    tenantId={selectedConversation.tenant_id}
                    unitId={selectedConversation.unit_id}
                    buildingId={selectedConversation.building_id}
                    onClose={() => setSelectedConversation(null)}
                  />
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-light">Wählen Sie eine Konversation aus</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Announcements Tab */}
        {isAdmin && (
          <TabsContent value="announcements" className="mt-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-light text-slate-900 text-lg">Ankündigungen</h2>
                <Button 
                  onClick={() => setShowAnnouncementDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ankündigung erstellen
                </Button>
              </div>
              
              <AnnouncementsList />
            </Card>

            <SendAnnouncementDialog 
              open={showAnnouncementDialog}
              onOpenChange={setShowAnnouncementDialog}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function AnnouncementsList() {
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.TenantCommunication.filter(
      { communication_type: 'announcement' },
      '-created_date',
      20
    ),
  });

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 font-light">Keine Ankündigungen erstellt</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map(ann => (
        <Card key={ann.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-light text-slate-900">{ann.title}</h3>
              <p className="text-sm font-light text-slate-600 mt-1">{ann.content.substring(0, 100)}...</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-slate-100 rounded font-light">
                  {ann.status}
                </span>
              </div>
            </div>
            <p className="text-xs font-light text-slate-500">
              {new Date(ann.created_date).toLocaleDateString('de-DE')}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}