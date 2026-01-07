import Analytics from './pages/Analytics';
import BankAccounts from './pages/BankAccounts';
import BankReconciliation from './pages/BankReconciliation';
import BuildingDetail from './pages/BuildingDetail';
import Buildings from './pages/Buildings';
import ContractDetail from './pages/ContractDetail';
import Contracts from './pages/Contracts';
import CostTypes from './pages/CostTypes';
import Dashboard from './pages/Dashboard';
import DeveloperDocumentation from './pages/DeveloperDocumentation';
import Documents from './pages/Documents';
import FinAPICallback from './pages/FinAPICallback';
import FinancialItems from './pages/FinancialItems';
import Finanzen from './pages/Finanzen';
import GeneratedBookings from './pages/GeneratedBookings';
import HilfeCenter from './pages/HilfeCenter';
import Invoices from './pages/Invoices';
import Kommunikation from './pages/Kommunikation';
import OperatingCosts from './pages/OperatingCosts';
import ProjectManagement from './pages/ProjectManagement';
import SupportCenter from './pages/SupportCenter';
import Tasks from './pages/Tasks';
import Tax from './pages/Tax';
import TaxForms from './pages/TaxForms';
import TaxLibraryManagement from './pages/TaxLibraryManagement';
import UnitDetail from './pages/UnitDetail';
import WhatsAppCommunication from './pages/WhatsAppCommunication';
import WhatsAppSettings from './pages/WhatsAppSettings';
import WhatsAppSetup from './pages/WhatsAppSetup';
import SuiteManagement from './pages/SuiteManagement';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import TestingDashboard from './pages/TestingDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "BankAccounts": BankAccounts,
    "BankReconciliation": BankReconciliation,
    "BuildingDetail": BuildingDetail,
    "Buildings": Buildings,
    "ContractDetail": ContractDetail,
    "Contracts": Contracts,
    "CostTypes": CostTypes,
    "Dashboard": Dashboard,
    "DeveloperDocumentation": DeveloperDocumentation,
    "Documents": Documents,
    "FinAPICallback": FinAPICallback,
    "FinancialItems": FinancialItems,
    "Finanzen": Finanzen,
    "GeneratedBookings": GeneratedBookings,
    "HilfeCenter": HilfeCenter,
    "Invoices": Invoices,
    "Kommunikation": Kommunikation,
    "OperatingCosts": OperatingCosts,
    "ProjectManagement": ProjectManagement,
    "SupportCenter": SupportCenter,
    "Tasks": Tasks,
    "Tax": Tax,
    "TaxForms": TaxForms,
    "TaxLibraryManagement": TaxLibraryManagement,
    "UnitDetail": UnitDetail,
    "WhatsAppCommunication": WhatsAppCommunication,
    "WhatsAppSettings": WhatsAppSettings,
    "WhatsAppSetup": WhatsAppSetup,
    "SuiteManagement": SuiteManagement,
    "UserManagement": UserManagement,
    "RoleManagement": RoleManagement,
    "TestingDashboard": TestingDashboard,
}

export const pagesConfig = {
    mainPage: "Documents",
    Pages: PAGES,
    Layout: __Layout,
};