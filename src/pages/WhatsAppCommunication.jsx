import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Settings, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function WhatsAppCommunication() {
  const [selectedChat, setSelectedChat] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">WhatsApp-Kommunikation</h1>
        <p className="text-slate-600 font-light mt-2">
          Verwalten Sie die Kommunikation mit Mietern über WhatsApp
        </p>
      </div>

      <Tabs defaultValue="chats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chats">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chats
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="templates">
                <Users className="w-4 h-4 mr-2" />
                Vorlagen
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Chats */}
        <TabsContent value="chats" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktive Chats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-600">Keine aktiven Chats</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Chat-Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedChat ? (
                  <p className="text-sm text-slate-600">Chat ausgewählt</p>
                ) : (
                  <p className="text-sm text-slate-500">Wählen Sie einen Chat aus</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vorlagen */}
        {isAdmin && (
          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp-Nachrichtenvorlagen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-50">
                    <CardContent className="pt-6">
                      <h3 className="font-medium text-sm mb-2">Mieterwillkommen</h3>
                      <p className="text-xs text-slate-600">Willkommensnachricht für neue Mieter</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardContent className="pt-6">
                      <h3 className="font-medium text-sm mb-2">Mietererinnerung</h3>
                      <p className="text-xs text-slate-600">Zahlungserinnerung</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Einstellungen */}
        {isAdmin && (
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp-Einstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    WhatsApp Business API ist nicht verbunden. Klicken Sie unten, um zu verbinden.
                  </p>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  WhatsApp verbinden
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}