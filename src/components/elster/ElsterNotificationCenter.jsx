import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, Mail, MessageSquare, Calendar, 
  AlertTriangle, CheckCircle, Info, X 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ElsterNotificationCenter() {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'deadline',
      severity: 'urgent',
      title: 'Abgabefrist läuft ab',
      message: 'Anlage V für 2023 muss bis 31.07.2024 eingereicht werden',
      date: new Date().toISOString(),
      read: false,
      actions: [
        { label: 'Jetzt einreichen', action: 'submit' }
      ]
    },
    {
      id: '2',
      type: 'validation',
      severity: 'warning',
      title: 'Validierungsfehler gefunden',
      message: '3 Fehler in EUER 2023 - Bitte korrigieren',
      date: new Date().toISOString(),
      read: false,
      actions: [
        { label: 'Fehler ansehen', action: 'view-errors' }
      ]
    },
    {
      id: '3',
      type: 'success',
      severity: 'info',
      title: 'Einreichung erfolgreich',
      message: 'Anlage V 2022 wurde vom Finanzamt akzeptiert',
      date: new Date(Date.now() - 86400000).toISOString(),
      read: true
    }
  ]);

  const [settings, setSettings] = useState({
    email: true,
    push: false,
    sms: false,
    deadlines: true,
    validations: true,
    submissions: true,
    reminders_days_before: 7
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('Alle als gelesen markiert');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Benachrichtigungen gelöscht');
  };

  const handleToggleSetting = async (key, value) => {
    setSettings({ ...settings, [key]: value });
    
    try {
      await base44.auth.updateMe({
        elster_notification_settings: { ...settings, [key]: value }
      });
      toast.success('Einstellungen gespeichert');
    } catch (error) {
      toast.error('Speichern fehlgeschlagen');
    }
  };

  const iconMap = {
    deadline: Calendar,
    validation: AlertTriangle,
    success: CheckCircle,
    info: Info
  };

  const severityConfig = {
    urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            ELSTER-Benachrichtigungen
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
              >
                Alle als gelesen
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              Alle löschen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Benachrichtigungen
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Keine Benachrichtigungen</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = iconMap[notification.type] || Info;
                  const config = severityConfig[notification.severity] || severityConfig.info;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${config.bg} ${config.border} ${
                        notification.read ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${notification.read ? 'bg-slate-200' : 'bg-white'}`}>
                          <Icon className={`w-4 h-4 ${config.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div className="font-medium">{notification.title}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              {new Date(notification.date).toLocaleString('de-DE')}
                            </div>
                            {notification.actions && (
                              <div className="flex gap-2">
                                {notification.actions.map((action, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Benachrichtigungskanäle</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="font-medium text-sm">E-Mail</div>
                        <div className="text-xs text-slate-600">
                          Benachrichtigungen per E-Mail erhalten
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email}
                      onCheckedChange={(checked) => handleToggleSetting('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="font-medium text-sm">Push-Benachrichtigungen</div>
                        <div className="text-xs text-slate-600">
                          Browser-Benachrichtigungen
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.push}
                      onCheckedChange={(checked) => handleToggleSetting('push', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="font-medium text-sm">SMS</div>
                        <div className="text-xs text-slate-600">
                          Wichtige Fristen per SMS
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.sms}
                      onCheckedChange={(checked) => handleToggleSetting('sms', checked)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Benachrichtigungstypen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Abgabefristen</div>
                      <div className="text-xs text-slate-600">
                        Erinnerungen an Steuerfristen
                      </div>
                    </div>
                    <Switch
                      checked={settings.deadlines}
                      onCheckedChange={(checked) => handleToggleSetting('deadlines', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Validierungen</div>
                      <div className="text-xs text-slate-600">
                        Fehler und Warnungen
                      </div>
                    </div>
                    <Switch
                      checked={settings.validations}
                      onCheckedChange={(checked) => handleToggleSetting('validations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Übermittlungen</div>
                      <div className="text-xs text-slate-600">
                        Status von Einreichungen
                      </div>
                    </div>
                    <Switch
                      checked={settings.submissions}
                      onCheckedChange={(checked) => handleToggleSetting('submissions', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}