import Analytics from './pages/Analytics';
import BankAccounts from './pages/BankAccounts';
import BankReconciliation from './pages/BankReconciliation';
import BuildingDetail from './pages/BuildingDetail';
import Buildings from './pages/Buildings';
import ContractDetail from './pages/ContractDetail';
import Contracts from './pages/Contracts';
import CostTypes from './pages/CostTypes';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import FinAPICallback from './pages/FinAPICallback';
import FinancialItems from './pages/FinancialItems';
import Finanzen from './pages/Finanzen';
import GeneratedBookings from './pages/GeneratedBookings';
import Invoices from './pages/Invoices';
import OperatingCosts from './pages/OperatingCosts';
import Tasks from './pages/Tasks';
import Tax from './pages/Tax';
import TaxForms from './pages/TaxForms';
import TaxLibraryManagement from './pages/TaxLibraryManagement';
import UnitDetail from './pages/UnitDetail';
import Kommunikation from './pages/Kommunikation';
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
    "Documents": Documents,
    "FinAPICallback": FinAPICallback,
    "FinancialItems": FinancialItems,
    "Finanzen": Finanzen,
    "GeneratedBookings": GeneratedBookings,
    "Invoices": Invoices,
    "OperatingCosts": OperatingCosts,
    "Tasks": Tasks,
    "Tax": Tax,
    "TaxForms": TaxForms,
    "TaxLibraryManagement": TaxLibraryManagement,
    "UnitDetail": UnitDetail,
    "Kommunikation": Kommunikation,
}

export const pagesConfig = {
    mainPage: "Documents",
    Pages: PAGES,
    Layout: __Layout,
};