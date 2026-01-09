import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Home, MessageSquare, Wrench, Bell, Menu, User, 
  Building2, FileText, Calendar, AlertCircle 
} from 'lucide-react';
import MobileMaintenanceRequest from '@/components/mobile/MobileMaintenanceRequest';
import MobileBuildingInfo from '@/components/mobile/MobileBuildingInfo';
import MobileMessaging from '@/components/mobile/MobileMessaging';
import MobileNotifications from '@/components/mobile/MobileNotifications';
import { usePushNotifications } from '@/components/mobile/usePushNotifications';

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('User load error:', error);
      }
    };
    loadUser();
  }, []);

  const { data: tenant } = useQuery({
    queryKey: ['currentTenant', user?.email],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter({ email: user.email }, null, 1);
      return tenants[0];
    },
    enabled: !!user?.email
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unreadMessages', tenant?.id],
    queryFn: async () => {
      const messages = await base44.entities.TenantMessage.filter({ 
        tenant_id: tenant.id,
        direction: 'to_tenant',
        is_read: false
      }, null, 100);
      return messages.length;
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000
  });

  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['unreadNotifications', user?.email],
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter({ 
        user_email: user.email,
        is_read: false
      }, null, 100);
      return notifications.length;
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Mieterportal</h1>
              <p className="text-sm text-blue-100">{user.full_name}</p>
            </div>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-blue-500"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Push Notification Banner */}
          {isSupported && !isSubscribed && (
            <div className="mt-3 bg-blue-500 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Bell className="w-4 h-4" />
                <p className="text-sm">Push-Benachrichtigungen aktivieren</p>
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={subscribe}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Aktivieren
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="home" className="space-y-4 mt-0">
            <MobileHomeView tenant={tenant} />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <MobileMessaging tenantId={tenant?.id} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0">
            <MobileMaintenanceRequest tenantId={tenant?.id} />
          </TabsContent>

          <TabsContent value="building" className="mt-0">
            <MobileBuildingInfo tenantId={tenant?.id} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <MobileNotifications userEmail={user?.email} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
        <div className="grid grid-cols-5 gap-1">
          <NavButton 
            icon={Home} 
            label="Home" 
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <NavButton 
            icon={MessageSquare} 
            label="Nachrichten" 
            active={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            badge={unreadMessages}
          />
          <NavButton 
            icon={Wrench} 
            label="Wartung" 
            active={activeTab === 'maintenance'}
            onClick={() => setActiveTab('maintenance')}
          />
          <NavButton 
            icon={Building2} 
            label="Gebäude" 
            active={activeTab === 'building'}
            onClick={() => setActiveTab('building')}
          />
          <NavButton 
            icon={User} 
            label="Profil" 
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-2 px-1 transition-colors ${
        active ? 'text-blue-600' : 'text-slate-600'
      }`}
    >
      <Icon className={`w-5 h-5 mb-1 ${active ? 'text-blue-600' : 'text-slate-600'}`} />
      <span className="text-xs font-medium">{label}</span>
      {badge > 0 && (
        <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {badge}
        </span>
      )}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"></div>
      )}
    </button>
  );
}

function MobileHomeView({ tenant }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantContracts', tenant?.id],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenant.id }, '-start_date', 5),
    enabled: !!tenant?.id
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['tenantMaintenance', tenant?.id],
    queryFn: () => base44.entities.MaintenanceTask.filter({ tenant_id: tenant.id }, '-created_date', 5),
    enabled: !!tenant?.id
  });

  const activeContract = contracts.find(c => c.status === 'active');
  const pendingRequests = maintenanceRequests.filter(r => r.status === 'pending' || r.status === 'in_progress');

  return (
    <div className="space-y-4">
      {/* Active Contract Card */}
      {activeContract && (
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-blue-100 text-sm">Aktiver Mietvertrag</p>
                <h3 className="text-xl font-bold mt-1">{activeContract.property_address || 'Meine Wohnung'}</h3>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-blue-100 text-xs">Miete</p>
                <p className="text-lg font-semibold">{activeContract.total_rent?.toLocaleString('de-DE')}€</p>
              </div>
              <div>
                <p className="text-blue-100 text-xs">Fällig am</p>
                <p className="text-lg font-semibold">{activeContract.rent_due_day || 3}. des Monats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Wrench className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">Wartung melden</p>
            {pendingRequests.length > 0 && (
              <Badge className="mt-2 bg-orange-100 text-orange-800">
                {pendingRequests.length} offen
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">Nachricht senden</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Maintenance Requests */}
      {maintenanceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte Anfragen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {maintenanceRequests.slice(0, 3).map(request => (
              <div key={request.id} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{request.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{new Date(request.created_date).toLocaleDateString('de-DE')}</p>
                </div>
                <Badge className={
                  request.status === 'completed' ? 'bg-green-100 text-green-800' :
                  request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {request.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}