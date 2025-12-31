import Analytics from './pages/Analytics';
import BankAccounts from './pages/BankAccounts';
import BankReconciliation from './pages/BankReconciliation';
import BuildingDetail from './pages/BuildingDetail';
import Buildings from './pages/Buildings';
import ContractDetail from './pages/ContractDetail';
import Contracts from './pages/Contracts';
import CostTypes from './pages/CostTypes';
import Dashboard from './pages/Dashboard';
import FinAPICallback from './pages/FinAPICallback';
import FinancialItems from './pages/FinancialItems';
import Invoices from './pages/Invoices';
import UnitDetail from './pages/UnitDetail';
import Finanzen from './pages/Finanzen';
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
    "FinAPICallback": FinAPICallback,
    "FinancialItems": FinancialItems,
    "Invoices": Invoices,
    "UnitDetail": UnitDetail,
    "Finanzen": Finanzen,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};