import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Send, Users, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function NotificationManagement() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all'
  });
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => base44.asServiceRole.entities.Notification.list('-created_date', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const sendBulkMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('sendBulkNotification', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      toast.success('Benachrichtigungen versendet');
      setFormData({ title: '', message: '', type: 'info', target: 'all' });
    }
  });

  const handleSend = () => {
    let user_ids = [];
    
    if (formData.target === 'all') {
      user_ids = users.map(u => u.id);
    } else if (formData.target === 'admins') {
      user_ids = users.filter(u => u.role === 'admin').map(u => u.id);
    } else if (formData.target === 'users') {
      user_ids = users.filter(u => u.role !== 'admin').map(u => u.id);
    }

    sendBulkMutation.mutate({
      user_ids,
      title: formData.title,
      message: formData.message,
      type: formData.type
    });
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    byType: {
      info: notifications.filter(n => n.type === 'info').length,
      success: notifications.filter(n => n.type === 'success').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Benachrichtigungen verwalten</h1>
        <p className="text-slate-600">System-weite Benachrichtigungen erstellen und verwalten</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Bell, label: "Gesamt", value: stats.total, color: "blue" },
          { icon: Bell, label: "Ungelesen", value: stats.unread, badge: true, color: "red" },
          { icon: Users, label: "Empfänger", value: users.length, color: "green" },
          { icon: BarChart3, label: "Nach Typ", stats: stats.byType }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-6">
            {stat.stats ? (
              <>
                <div className="text-sm text-slate-600 mb-2">Nach Typ</div>
                <div className="space-y-1 text-xs">
                  {Object.entries(stat.stats).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
                {stat.badge ? (
                  <Badge className="bg-red-600">{stat.value}</Badge>
                ) : (
                  <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send">Benachrichtigung senden</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Neue Benachrichtigung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Empfänger</Label>
                  <Select value={formData.target} onValueChange={(val) => setFormData({...formData, target: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Benutzer ({users.length})</SelectItem>
                      <SelectItem value="admins">Nur Admins ({users.filter(u => u.role === 'admin').length})</SelectItem>
                      <SelectItem value="users">Nur Benutzer ({users.filter(u => u.role !== 'admin').length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Typ</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Erfolg</SelectItem>
                      <SelectItem value="warning">Warnung</SelectItem>
                      <SelectItem value="error">Fehler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Titel</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Benachrichtigungstitel"
                />
              </div>

              <div>
                <Label>Nachricht</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Nachrichtentext..."
                  className="min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={sendBulkMutation.isPending || !formData.title || !formData.message}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Benachrichtigung senden
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{notification.title}</span>
                          <Badge variant="outline">{notification.type}</Badge>
                          {!notification.is_read && (
                            <Badge className="bg-red-600">Ungelesen</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                        <div className="text-xs text-slate-500">
                          {format(parseISO(notification.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}