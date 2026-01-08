import APIKeyManagement from './pages/APIKeyManagement';
import ActivityLogs from './pages/ActivityLogs';
import AdminDashboard from './pages/AdminDashboard';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import AdvancedReportBuilder from './pages/AdvancedReportBuilder';
import AdvancedSearch from './pages/AdvancedSearch';
import Analytics from './pages/Analytics';
import AuditReports from './pages/AuditReports';
import BankAccounts from './pages/BankAccounts';
import BankReconciliation from './pages/BankReconciliation';
import BuildingDetail from './pages/BuildingDetail';
import Buildings from './pages/Buildings';
import BulkOperations from './pages/BulkOperations';
import ComplianceCenter from './pages/ComplianceCenter';
import ContractDetail from './pages/ContractDetail';
import Contracts from './pages/Contracts';
import CostTypes from './pages/CostTypes';
import CustomDashboard from './pages/CustomDashboard';
import Dashboard from './pages/Dashboard';
import DataImportExport from './pages/DataImportExport';
import DeveloperDocumentation from './pages/DeveloperDocumentation';
import Documents from './pages/Documents';
import ElsterIntegration from './pages/ElsterIntegration';
import EmailTemplates from './pages/EmailTemplates';
import FinAPICallback from './pages/FinAPICallback';
import FinancialItems from './pages/FinancialItems';
import Finanzen from './pages/Finanzen';
import GeneratedBookings from './pages/GeneratedBookings';
import HilfeCenter from './pages/HilfeCenter';
import Invoices from './pages/Invoices';
import KnowledgeManagementDashboard from './pages/KnowledgeManagementDashboard';
import Kommunikation from './pages/Kommunikation';
import ModuleManagement from './pages/ModuleManagement';
import MyAccount from './pages/MyAccount';
import NotificationManagement from './pages/NotificationManagement';
import Onboarding from './pages/Onboarding';
import OperatingCosts from './pages/OperatingCosts';
import PackageManager from './pages/PackageManager';
import Payments from './pages/Payments';
import PermissionDashboard from './pages/PermissionDashboard';
import ProjectManagement from './pages/ProjectManagement';
import PropertyPortfolio from './pages/PropertyPortfolio';
import ReportGenerator from './pages/ReportGenerator';
import ReportScheduling from './pages/ReportScheduling';
import RoleManagement from './pages/RoleManagement';
import SuiteManagement from './pages/SuiteManagement';
import SupportCenter from './pages/SupportCenter';
import SystemHealth from './pages/SystemHealth';
import Tasks from './pages/Tasks';
import Tax from './pages/Tax';
import TaxForms from './pages/TaxForms';
import TaxLibraryManagement from './pages/TaxLibraryManagement';
import TenantPortal from './pages/TenantPortal';
import TesterOnboarding from './pages/TesterOnboarding';
import TestingDashboard from './pages/TestingDashboard';
import UnitDetail from './pages/UnitDetail';
import UserDetail from './pages/UserDetail';
import UserManagement from './pages/UserManagement';
import UserSettings from './pages/UserSettings';
import WhatsAppCommunication from './pages/WhatsAppCommunication';
import WhatsAppSettings from './pages/WhatsAppSettings';
import WhatsAppSetup from './pages/WhatsAppSetup';
import WorkflowAutomation from './pages/WorkflowAutomation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APIKeyManagement": APIKeyManagement,
    "ActivityLogs": ActivityLogs,
    "AdminDashboard": AdminDashboard,
    "AdvancedAnalytics": AdvancedAnalytics,
    "AdvancedReportBuilder": AdvancedReportBuilder,
    "AdvancedSearch": AdvancedSearch,
    "Analytics": Analytics,
    "AuditReports": AuditReports,
    "BankAccounts": BankAccounts,
    "BankReconciliation": BankReconciliation,
    "BuildingDetail": BuildingDetail,
    "Buildings": Buildings,
    "BulkOperations": BulkOperations,
    "ComplianceCenter": ComplianceCenter,
    "ContractDetail": ContractDetail,
    "Contracts": Contracts,
    "CostTypes": CostTypes,
    "CustomDashboard": CustomDashboard,
    "Dashboard": Dashboard,
    "DataImportExport": DataImportExport,
    "DeveloperDocumentation": DeveloperDocumentation,
    "Documents": Documents,
    "ElsterIntegration": ElsterIntegration,
    "EmailTemplates": EmailTemplates,
    "FinAPICallback": FinAPICallback,
    "FinancialItems": FinancialItems,
    "Finanzen": Finanzen,
    "GeneratedBookings": GeneratedBookings,
    "HilfeCenter": HilfeCenter,
    "Invoices": Invoices,
    "KnowledgeManagementDashboard": KnowledgeManagementDashboard,
    "Kommunikation": Kommunikation,
    "ModuleManagement": ModuleManagement,
    "MyAccount": MyAccount,
    "NotificationManagement": NotificationManagement,
    "Onboarding": Onboarding,
    "OperatingCosts": OperatingCosts,
    "PackageManager": PackageManager,
    "Payments": Payments,
    "PermissionDashboard": PermissionDashboard,
    "ProjectManagement": ProjectManagement,
    "PropertyPortfolio": PropertyPortfolio,
    "ReportGenerator": ReportGenerator,
    "ReportScheduling": ReportScheduling,
    "RoleManagement": RoleManagement,
    "SuiteManagement": SuiteManagement,
    "SupportCenter": SupportCenter,
    "SystemHealth": SystemHealth,
    "Tasks": Tasks,
    "Tax": Tax,
    "TaxForms": TaxForms,
    "TaxLibraryManagement": TaxLibraryManagement,
    "TenantPortal": TenantPortal,
    "TesterOnboarding": TesterOnboarding,
    "TestingDashboard": TestingDashboard,
    "UnitDetail": UnitDetail,
    "UserDetail": UserDetail,
    "UserManagement": UserManagement,
    "UserSettings": UserSettings,
    "WhatsAppCommunication": WhatsAppCommunication,
    "WhatsAppSettings": WhatsAppSettings,
    "WhatsAppSetup": WhatsAppSetup,
    "WorkflowAutomation": WorkflowAutomation,
}

export const pagesConfig = {
    mainPage: "Documents",
    Pages: PAGES,
    Layout: __Layout,
};