import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
    Building2, 
    Home, 
    Users, 
    FileText, 
    CreditCard, 
    BarChart3, 
    Landmark,
    Menu,
    X,
    ChevronRight,
    BookOpen,
    MessageSquare,
    HelpCircle,
    AlertCircle,
    Target,
    Settings,
    Shield,
    TestTube,
    Mail,
    Calendar,
    Search,
    Upload,
    Zap,
    Database,
    Sparkles,
    Package,
    TrendingUp,
    Activity,
    Bell
} from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationCenter from '@/components/notifications/NotificationCenter';
import SuiteSwitcher from '@/components/suite/SuiteSwitcher';
import { useUserSuites } from '@/components/suite/useModuleAccess';
import TesterTracker from '@/components/testing/TesterTracker';
import SmartProblemReportButton from '@/components/testing/SmartProblemReportButton';
import { Button } from "@/components/ui/button";
import OnboardingRedirect from '@/components/onboarding/OnboardingRedirect';

export default function Layout({ children, currentPageName }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: userSuites } = useUserSuites();

    // Hilfsfunktion: Prüft ob User Zugriff auf ein Modul hat
    const hasModuleAccess = (moduleName) => {
        if (!userSuites) return true; // Während des Ladens: alles anzeigen
        
        // Prüfe ob Modul in einer aktiven Suite enthalten ist
        const hasViaSuite = userSuites.suites?.some(suite => 
            suite.included_modules?.includes(moduleName)
        );
        
        // Prüfe ob direkter Modul-Zugriff besteht
        const hasDirectAccess = userSuites.modules?.some(mod => 
            mod.name === moduleName && mod.access.access_level !== 'none'
        );
        
        return hasViaSuite || hasDirectAccess;
    };

    const navigation = [
        { name: 'Dashboard', href: createPageUrl('Dashboard'), icon: Home, page: 'Dashboard' },
        { name: '🚀 Setup-Assistent', href: createPageUrl('Onboarding'), icon: Sparkles, page: 'Onboarding' },
        { name: '🎨 Mein Dashboard', href: createPageUrl('CustomDashboard'), icon: Settings, page: 'CustomDashboard' },
        { name: '⚙️ Admin', href: createPageUrl('AdminDashboard'), icon: Settings, page: 'AdminDashboard' },
        { name: '🎯 Suite Management', href: createPageUrl('SuiteManagement'), icon: Settings, page: 'SuiteManagement' },
        { name: '👥 Benutzerverwaltung', href: createPageUrl('UserManagement'), icon: Users, page: 'UserManagement' },
        { name: '🔐 Rollen', href: createPageUrl('RoleManagement'), icon: Shield, page: 'RoleManagement' },
        { name: '📦 Module', href: createPageUrl('ModuleManagement'), icon: Package, page: 'ModuleManagement' },
        { name: '🧪 Testing', href: createPageUrl('TestingDashboard'), icon: TestTube, page: 'TestingDashboard' },
        { name: '📊 Report Generator', href: createPageUrl('ReportGenerator'), icon: BarChart3, page: 'ReportGenerator' },
        { name: '📊 Report Generator', href: createPageUrl('ReportGenerator'), icon: BarChart3, page: 'ReportGenerator' },
        { name: '📊 Audit Reports', href: createPageUrl('AuditReports'), icon: BarChart3, page: 'AuditReports' },
        { name: '📈 Analytics', href: createPageUrl('AdvancedAnalytics'), icon: TrendingUp, page: 'AdvancedAnalytics' },
        { name: '🔐 Permissions', href: createPageUrl('PermissionDashboard'), icon: Shield, page: 'PermissionDashboard' },
        { name: '🛡️ Compliance', href: createPageUrl('ComplianceCenter'), icon: Shield, page: 'ComplianceCenter' },
        { name: '🔑 API Keys', href: createPageUrl('APIKeyManagement'), icon: Settings, page: 'APIKeyManagement' },
        { name: '💚 System Health', href: createPageUrl('SystemHealth'), icon: Activity, page: 'SystemHealth' },
        { name: '📋 Activity Logs', href: createPageUrl('ActivityLogs'), icon: Activity, page: 'ActivityLogs' },
        { name: '📊 Analytics', href: createPageUrl('Analytics'), icon: BarChart3, page: 'Analytics' },
        { name: '📅 Report-Scheduling', href: createPageUrl('ReportScheduling'), icon: Calendar, page: 'ReportScheduling' },
        { name: '🔍 Erweiterte Suche', href: createPageUrl('AdvancedSearch'), icon: Search, page: 'AdvancedSearch' },
        { name: '🏛️ ELSTER-Integration', href: createPageUrl('ElsterIntegration'), icon: FileText, page: 'ElsterIntegration' },
        { name: '📥 Import/Export', href: createPageUrl('DataImportExport'), icon: Upload, page: 'DataImportExport' },
        { name: '⚡ Workflow Automation', href: createPageUrl('WorkflowAutomation'), icon: Zap, page: 'WorkflowAutomation' },
        { name: '🔄 Bulk-Operationen', href: createPageUrl('BulkOperations'), icon: Database, page: 'BulkOperations' },
        { name: 'Objekte', href: createPageUrl('Buildings'), icon: Building2, page: 'Buildings', requiresModule: 'property' },
        { name: 'Mieter', href: createPageUrl('Contracts'), icon: FileText, page: 'Contracts', requiresModule: 'tenants' },
        { name: 'Kommunikation', href: createPageUrl('Kommunikation'), icon: MessageSquare, page: 'Kommunikation', requiresModule: 'communication' },
        { name: '📧 E-Mail Templates', href: createPageUrl('EmailTemplates'), icon: Mail, page: 'EmailTemplates', requiresModule: 'communication' },
        { name: '💬 WhatsApp', href: createPageUrl('WhatsAppCommunication'), icon: MessageSquare, page: 'WhatsAppCommunication', requiresModule: 'communication' },
        { name: '⚙️ WhatsApp Settings', href: createPageUrl('WhatsAppSettings'), icon: Settings, page: 'WhatsAppSettings', requiresModule: 'communication' },
        { name: 'Aufgaben', href: createPageUrl('Tasks'), icon: FileText, page: 'Tasks', requiresModule: 'tasks' },
        { name: 'Dokumente', href: createPageUrl('Documents'), icon: FileText, page: 'Documents', requiresModule: 'documents' },
        { name: 'Finanzen', href: createPageUrl('Finanzen'), icon: CreditCard, page: 'Finanzen', requiresModule: 'finance' },
        { name: 'Generierte Buchungen', href: createPageUrl('GeneratedBookings'), icon: FileText, page: 'GeneratedBookings', requiresModule: 'finance' },
        { name: 'Rechnungen & Belege', href: createPageUrl('Invoices'), icon: FileText, page: 'Invoices', requiresModule: 'finance' },
        { name: 'Steuerformulare', href: createPageUrl('TaxForms'), icon: BookOpen, page: 'TaxForms', requiresModule: 'tax_rental' },
        { name: 'Betriebskosten', href: createPageUrl('OperatingCosts'), icon: FileText, page: 'OperatingCosts', requiresModule: 'property' },
        { name: 'Bank/Kasse', href: createPageUrl('BankAccounts'), icon: Landmark, page: 'BankAccounts', requiresModule: 'accounts' },
        { name: '───────────', disabled: true },
        { name: '📖 Entwickler-Doku', href: createPageUrl('DeveloperDocumentation'), icon: BookOpen, page: 'DeveloperDocumentation' },
        { name: '🆘 Support-Center', href: createPageUrl('SupportCenter'), icon: AlertCircle, page: 'SupportCenter' },
        { name: '🔔 Benachrichtigungen', href: createPageUrl('NotificationManagement'), icon: Bell, page: 'NotificationManagement' },
        { name: '🚀 Projekt-Management', href: createPageUrl('ProjectManagement'), icon: Target, page: 'ProjectManagement' },
        { name: '❓ Hilfe-Center', href: createPageUrl('HilfeCenter'), icon: HelpCircle, page: 'HilfeCenter' },
    ];

    // Filtere Navigation basierend auf Modul-Zugriff
    const visibleNavigation = navigation.filter(item => {
        if (item.disabled) return true;
        if (!item.requiresModule) return true;
        return hasModuleAccess(item.requiresModule);
    });

    return (
            <OnboardingRedirect>
            <TesterTracker>
            <div className="min-h-screen bg-slate-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-slate-800 text-lg tracking-tight">ImmoVerwalter</span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {visibleNavigation.map((item) => {
                        if (item.disabled) {
                            return (
                                <div key={item.name} className="my-2 border-t border-slate-200" />
                            );
                        }
                        const isActive = currentPageName === item.page;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive 
                                        ? "bg-emerald-50 text-emerald-700" 
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-emerald-600" : "text-slate-400"
                                )} />
                                {item.name}
                                {isActive && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-emerald-500" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-3">
                            <SuiteSwitcher />
                            <NotificationCenter />
                            <Link to={createPageUrl('UserSettings')}>
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5 text-slate-600" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>

                {/* Smart Problem Report Button */}
                <SmartProblemReportButton />
            </div>
            </div>
            </TesterTracker>
            </OnboardingRedirect>
            );
            }