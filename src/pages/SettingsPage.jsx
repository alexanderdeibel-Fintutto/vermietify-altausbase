import React from 'react';
import { TabsVertical, TabsVerticalList, TabsVerticalTrigger, TabsVerticalContent } from '@/components/ui/tabs-vertical';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import { User, Bell, CreditCard, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Einstellungen</h1>

      <TabsVertical defaultValue="profile" className="grid lg:grid-cols-[240px_1fr] gap-6">
        <TabsVerticalList>
          <TabsVerticalTrigger value="profile">
            <User className="h-5 w-5 vf-sidebar-item-icon" />
            <span className="vf-sidebar-item-label">Profil</span>
          </TabsVerticalTrigger>
          <TabsVerticalTrigger value="notifications">
            <Bell className="h-5 w-5 vf-sidebar-item-icon" />
            <span className="vf-sidebar-item-label">Benachrichtigungen</span>
          </TabsVerticalTrigger>
          <TabsVerticalTrigger value="subscription">
            <CreditCard className="h-5 w-5 vf-sidebar-item-icon" />
            <span className="vf-sidebar-item-label">Abonnement</span>
          </TabsVerticalTrigger>
          <TabsVerticalTrigger value="security">
            <Shield className="h-5 w-5 vf-sidebar-item-icon" />
            <span className="vf-sidebar-item-label">Sicherheit</span>
          </TabsVerticalTrigger>
        </TabsVerticalList>

        <div>
          <TabsVerticalContent value="profile">
            <div className="vf-card p-6">
              <h2 className="text-xl font-semibold mb-4">Profilinfomationen</h2>
              <p className="text-[var(--theme-text-secondary)]">Profil-Einstellungen</p>
            </div>
          </TabsVerticalContent>

          <TabsVerticalContent value="notifications">
            <NotificationSettings />
          </TabsVerticalContent>

          <TabsVerticalContent value="subscription">
            <div className="vf-card p-6">
              <h2 className="text-xl font-semibold mb-4">Abonnement verwalten</h2>
              <p className="text-[var(--theme-text-secondary)]">Abo-Details und Zahlungsmethoden</p>
            </div>
          </TabsVerticalContent>

          <TabsVerticalContent value="security">
            <div className="vf-card p-6">
              <h2 className="text-xl font-semibold mb-4">Sicherheitseinstellungen</h2>
              <p className="text-[var(--theme-text-secondary)]">Passwort und Zwei-Faktor-Authentifizierung</p>
            </div>
          </TabsVerticalContent>
        </div>
      </TabsVertical>
    </div>
  );
}