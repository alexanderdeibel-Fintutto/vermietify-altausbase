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
    Target
} from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function Layout({ children, currentPageName }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: createPageUrl('Dashboard'), icon: Home, page: 'Dashboard' },
        { name: 'Objekte', href: createPageUrl('Buildings'), icon: Building2, page: 'Buildings' },
        { name: 'Mieter', href: createPageUrl('Contracts'), icon: FileText, page: 'Contracts' },
        { name: 'Kommunikation', href: createPageUrl('Kommunikation'), icon: MessageSquare, page: 'Kommunikation' },
        { name: '💬 WhatsApp', href: createPageUrl('WhatsAppCommunication'), icon: MessageSquare, page: 'WhatsAppCommunication' },
        { name: '⚙️ WhatsApp Settings', href: createPageUrl('WhatsAppSettings'), icon: Settings, page: 'WhatsAppSettings' },
        { name: 'Aufgaben', href: createPageUrl('Tasks'), icon: FileText, page: 'Tasks' },
        { name: 'Dokumente', href: createPageUrl('Documents'), icon: FileText, page: 'Documents' },
        { name: 'Finanzen', href: createPageUrl('Finanzen'), icon: CreditCard, page: 'Finanzen' },
        { name: 'Generierte Buchungen', href: createPageUrl('GeneratedBookings'), icon: FileText, page: 'GeneratedBookings' },
        { name: 'Rechnungen & Belege', href: createPageUrl('Invoices'), icon: FileText, page: 'Invoices' },
        { name: 'Steuerformulare', href: createPageUrl('TaxForms'), icon: BookOpen, page: 'TaxForms' },
        { name: 'Betriebskosten', href: createPageUrl('OperatingCosts'), icon: FileText, page: 'OperatingCosts' },
        { name: 'Bank/Kasse', href: createPageUrl('BankAccounts'), icon: Landmark, page: 'BankAccounts' },
        { name: '───────────', disabled: true },
        { name: '📖 Entwickler-Doku', href: createPageUrl('DeveloperDocumentation'), icon: BookOpen, page: 'DeveloperDocumentation' },
        { name: '🆘 Support-Center', href: createPageUrl('SupportCenter'), icon: AlertCircle, page: 'SupportCenter' },
        { name: '🚀 Projekt-Management', href: createPageUrl('ProjectManagement'), icon: Target, page: 'ProjectManagement' },
        { name: '❓ Hilfe-Center', href: createPageUrl('HilfeCenter'), icon: HelpCircle, page: 'HilfeCenter' },
    ];

    return (
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
                    {navigation.map((item) => {
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
                        <NotificationCenter />
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}