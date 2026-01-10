import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, Wrench, Users, MessageSquare, 
  CheckCircle, AlertCircle, Building2, Plus
} from 'lucide-react';
import MobileMeterScanner from '@/components/meters/MobileMeterScanner';
import OfflineMeterQueue from '@/components/meters/OfflineMeterQueue';
import QuickTaskCreator from '@/components/vermieter-go/QuickTaskCreator';
import TenantQuickView from '@/components/vermieter-go/TenantQuickView';
import BuildingBoardMobile from '@/components/vermieter-go/BuildingBoardMobile';
import QuickStats from '@/components/vermieter-go/QuickStats';
import DirectMessaging from '@/components/vermieter-go/DirectMessaging';
import DamageReport from '@/components/vermieter-go/DamageReport';
import DigitalSignature from '@/components/vermieter-go/DigitalSignature';
import MaintenanceChecklist from '@/components/vermieter-go/MaintenanceChecklist';
import DayPlanner from '@/components/vermieter-go/DayPlanner';
import GPSNavigation from '@/components/vermieter-go/GPSNavigation';
import WeatherWidget from '@/components/vermieter-go/WeatherWidget';
import EmergencyContacts from '@/components/vermieter-go/EmergencyContacts';
import KeyManagement from '@/components/vermieter-go/KeyManagement';
import FloorPlanAccess from '@/components/vermieter-go/FloorPlanAccess';
import ExpenseTracker from '@/components/vermieter-go/ExpenseTracker';
import RentPaymentStatus from '@/components/vermieter-go/RentPaymentStatus';
import TimeTracker from '@/components/vermieter-go/TimeTracker';
import PhotoGallery from '@/components/vermieter-go/PhotoGallery';
import VoiceRecorder from '@/components/vermieter-go/VoiceRecorder';
import QRScanner from '@/components/vermieter-go/QRScanner';
import BeforeAfterPhotos from '@/components/vermieter-go/BeforeAfterPhotos';
import ViewingScheduler from '@/components/vermieter-go/ViewingScheduler';
import MaterialInventory from '@/components/vermieter-go/MaterialInventory';
import RecurringMaintenance from '@/components/vermieter-go/RecurringMaintenance';
import TourPlanner from '@/components/vermieter-go/TourPlanner';
import PushNotifications from '@/components/vermieter-go/PushNotifications';
import TeamUpdates from '@/components/vermieter-go/TeamUpdates';
import DocumentScanner from '@/components/vermieter-go/DocumentScanner';
import UnitRating from '@/components/vermieter-go/UnitRating';
import EnergyPassportAccess from '@/components/vermieter-go/EnergyPassportAccess';
import BuildingNotes from '@/components/vermieter-go/BuildingNotes';
import DepositTracker from '@/components/vermieter-go/DepositTracker';
import WarrantyTracker from '@/components/vermieter-go/WarrantyTracker';
import InsuranceClaim from '@/components/vermieter-go/InsuranceClaim';
import QuickVendorAssignment from '@/components/vermieter-go/QuickVendorAssignment';
import ParkingManagement from '@/components/vermieter-go/ParkingManagement';
import VacancyOverview from '@/components/vermieter-go/VacancyOverview';
import FacilityManagement from '@/components/vermieter-go/FacilityManagement';
import NeighborComplaints from '@/components/vermieter-go/NeighborComplaints';
import QuoteCreator from '@/components/vermieter-go/QuoteCreator';
import SeasonalChecklist from '@/components/vermieter-go/SeasonalChecklist';
import TenantFeedbackCollector from '@/components/vermieter-go/TenantFeedbackCollector';
import OfflineSyncStatus from '@/components/vermieter-go/OfflineSyncStatus';
import FinanceDashboard from '@/components/vermieter-go/FinanceDashboard';
import MonthlyReport from '@/components/vermieter-go/MonthlyReport';
import TaxDocuments from '@/components/vermieter-go/TaxDocuments';
import BudgetComparison from '@/components/vermieter-go/BudgetComparison';
import BroadcastMessage from '@/components/vermieter-go/BroadcastMessage';
import SMSNotifier from '@/components/vermieter-go/SMSNotifier';
import EmailTemplates from '@/components/vermieter-go/EmailTemplates';
import WhatsAppMessenger from '@/components/vermieter-go/WhatsAppMessenger';
import CalendarView from '@/components/vermieter-go/CalendarView';
import DeadlineReminders from '@/components/vermieter-go/DeadlineReminders';
import ContractOverview from '@/components/vermieter-go/ContractOverview';
import LegalUpdates from '@/components/vermieter-go/LegalUpdates';
import OccupancyStats from '@/components/vermieter-go/OccupancyStats';
import RentPriceTrend from '@/components/vermieter-go/RentPriceTrend';
import ROIDashboard from '@/components/vermieter-go/ROIDashboard';
import BenchmarkComparison from '@/components/vermieter-go/BenchmarkComparison';
import BarcodeScanner from '@/components/vermieter-go/BarcodeScanner';
import NFCReader from '@/components/vermieter-go/NFCReader';
import AutoBackup from '@/components/vermieter-go/AutoBackup';
import CurrencyConverter from '@/components/vermieter-go/CurrencyConverter';

export default function VermieterGo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-name', 100)
  });

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return await base44.entities.BuildingTask.filter(
        { 
          status: { $in: ['open', 'assigned', 'in_progress'] },
          assigned_to: user?.email
        },
        '-priority',
        20
      );
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Vermieter Go</h1>
              <p className="text-xs text-blue-100">Mobiler Außendienst</p>
            </div>
          </div>
          <Badge className="bg-white text-blue-900">
            {todayTasks.length} Tasks
          </Badge>
        </div>

        {/* Building Selector */}
        <select
          value={selectedBuilding || ''}
          onChange={(e) => setSelectedBuilding(e.target.value || null)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white backdrop-blur"
        >
          <option value="">Alle Gebäude</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="p-4 space-y-4">
        {/* Weather */}
        <WeatherWidget />

        {/* Offline Sync Status */}
        <OfflineSyncStatus />

        {/* Quick Stats */}
        <QuickStats buildingId={selectedBuilding} />

        {/* Offline Queue */}
        <OfflineMeterQueue />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="dashboard">
              <Building2 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="meter">
              <Camera className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Wrench className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tenants">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Wrench className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DayPlanner buildingId={selectedBuilding} />
            <FinanceDashboard buildingId={selectedBuilding} />
            <OccupancyStats buildingId={selectedBuilding} />
            <RentPaymentStatus buildingId={selectedBuilding} />
            <DepositTracker buildingId={selectedBuilding} />
            <VacancyOverview buildingId={selectedBuilding} />
            <ROIDashboard buildingId={selectedBuilding} />
            <CalendarView buildingId={selectedBuilding} />
            <DeadlineReminders />
            <TourPlanner />
            <GPSNavigation buildingId={selectedBuilding} />
            <BuildingBoardMobile buildingId={selectedBuilding} />
          </TabsContent>

          <TabsContent value="meter">
            <MobileMeterScanner buildingId={selectedBuilding} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <QuickTaskCreator buildingId={selectedBuilding} />
            <DamageReport buildingId={selectedBuilding} />
            <MaintenanceChecklist buildingId={selectedBuilding} />
            <SeasonalChecklist buildingId={selectedBuilding} />
            <ExpenseTracker buildingId={selectedBuilding} />
            <BudgetComparison buildingId={selectedBuilding} />
            <TimeTracker buildingId={selectedBuilding} />
            <QuoteCreator buildingId={selectedBuilding} />
            <RecurringMaintenance buildingId={selectedBuilding} />
            <QuickVendorAssignment />
            <WarrantyTracker buildingId={selectedBuilding} />
            <InsuranceClaim buildingId={selectedBuilding} />
            <BeforeAfterPhotos />
            <MonthlyReport buildingId={selectedBuilding} />
            <TaxDocuments buildingId={selectedBuilding} />
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <TenantQuickView buildingId={selectedBuilding} />
            <DirectMessaging buildingId={selectedBuilding} />
            <BroadcastMessage buildingId={selectedBuilding} />
            <WhatsAppMessenger />
            <SMSNotifier />
            <EmailTemplates />
            <ViewingScheduler />
            <TenantFeedbackCollector />
            <UnitRating />
            <DigitalSignature />
            <NeighborComplaints buildingId={selectedBuilding} />
            <ContractOverview />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <QRScanner />
            <BarcodeScanner />
            <NFCReader />
            <DocumentScanner buildingId={selectedBuilding} />
            <PhotoGallery buildingId={selectedBuilding} />
            <VoiceRecorder onSave={(text) => console.log('Voice note:', text)} />
            <BuildingNotes buildingId={selectedBuilding} />
            <MaterialInventory />
            <ParkingManagement buildingId={selectedBuilding} />
            <FacilityManagement buildingId={selectedBuilding} />
            <EmergencyContacts />
            <KeyManagement buildingId={selectedBuilding} />
            <FloorPlanAccess buildingId={selectedBuilding} />
            <EnergyPassportAccess buildingId={selectedBuilding} />
            <RentPriceTrend />
            <BenchmarkComparison />
            <LegalUpdates />
            <CurrencyConverter />
            <AutoBackup />
            <PushNotifications />
            <TeamUpdates />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 flex flex-col items-center gap-1 ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs">Start</span>
          </button>
          <button
            onClick={() => setActiveTab('meter')}
            className={`py-3 flex flex-col items-center gap-1 ${
              activeTab === 'meter' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">Zähler</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 flex flex-col items-center gap-1 ${
              activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-xs">Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-3 flex flex-col items-center gap-1 ${
              activeTab === 'tenants' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Mieter</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 flex flex-col items-center gap-1 ${
              activeTab === 'tools' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-xs">Tools</span>
          </button>
        </div>
      </div>
    </div>
  );
}