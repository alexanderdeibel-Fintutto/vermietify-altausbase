import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getMyConversations } from '../components/services/messaging';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, FileText, UserPlus, Building, AlertCircle } from 'lucide-react';
import ChatView from '../components/tenant-portal/ChatView';
import ConversationList from '../components/tenant-portal/ConversationList';
import TenantInvitationManager from '../components/tenant-portal/TenantInvitationManager';
import DocumentShareManager from '../components/tenant-portal/DocumentShareManager';
import BulkDocumentShareDialog from '../components/tenant-portal/BulkDocumentShareDialog';
import DamageReportViewer from '../components/tenant-portal/DamageReportViewer';

export default function TenantPortalManagement() {
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  // Gebäude laden
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
  });
  
  // Conversations laden
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', selectedBuilding],
    queryFn: () => getMyConversations({
      buildingId: selectedBuilding === 'all' ? null : selectedBuilding
    }),
  });
  
  // Schadenmeldungen laden
  const { data: damageReports = [] } = useQuery({
    queryKey: ['damage-reports', selectedBuilding],
    queryFn: async () => {
      const filter = selectedBuilding === 'all' 
        ? { kategorie: 'Reparatur' }
        : { kategorie: 'Reparatur', building_id: selectedBuilding };
      return base44.entities.MaintenanceTask.filter(filter);
    },
  });
  
  // Ungelesene Nachrichten zählen
  const unreadCount = conversations.reduce((sum, conv) => {
    return sum + (conv.conversation_members?.[0]?.unread_count || 0);
  }, 0);
  
  const openDamageReports = damageReports.filter(r => r.status === 'Offen').length;
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mieterportal-Verwaltung</h1>
          <p className="text-gray-600">
            Verwalten Sie die Kommunikation mit Ihren Mietern über die MieterApp
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversations.length}</p>
                <p className="text-sm text-gray-600">Konversationen</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-gray-600">Ungelesen</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openDamageReports}</p>
                <p className="text-sm text-gray-600">Offene Schäden</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{buildings.length}</p>
                <p className="text-sm text-gray-600">Gebäude</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Filter */}
        <div className="mb-6">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Gebäude wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Gebäude</SelectItem>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Konversationen
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-blue-600">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Dokumente
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Einladungen
            </TabsTrigger>
          </TabsList>
          
          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversation List */}
              <div className="lg:col-span-1">
                <Card className="h-[600px] overflow-y-auto">
                  <div className="p-4 border-b bg-white sticky top-0">
                    <h3 className="font-semibold">Nachrichten</h3>
                  </div>
                  <div className="p-4">
                    {loadingConversations ? (
                      <div className="text-center py-12 text-gray-500">Laden...</div>
                    ) : (
                      <ConversationList
                        conversations={conversations}
                        onSelect={setSelectedConversation}
                        selectedId={selectedConversation?.id}
                      />
                    )}
                  </div>
                </Card>
              </div>
              
              {/* Chat View */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  {selectedConversation ? (
                    <ChatView
                      conversationId={selectedConversation.id}
                      conversation={selectedConversation}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Wählen Sie eine Konversation aus</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              <div className="flex justify-end">
                <BulkDocumentShareDialog buildingId={selectedBuilding} />
              </div>
              <DocumentShareManager
                buildingId={selectedBuilding === 'all' ? null : selectedBuilding}
                unitId={null}
              />
            </div>
          </TabsContent>
          
          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <TenantInvitationManager
              buildingId={selectedBuilding === 'all' ? null : selectedBuilding}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}