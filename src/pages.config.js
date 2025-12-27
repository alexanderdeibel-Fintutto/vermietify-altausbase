import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import BuildingDetail from './pages/BuildingDetail';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import BankAccounts from './pages/BankAccounts';
import Analytics from './pages/Analytics';
import Tenants from './pages/Tenants';
import ContractDetail from './pages/ContractDetail';
import BankReconciliation from './pages/BankReconciliation';
import UnitDetail from './pages/UnitDetail';
import TransactionCategories from './pages/TransactionCategories';
import FinancialReports from './pages/FinancialReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Buildings": Buildings,
    "BuildingDetail": BuildingDetail,
    "Contracts": Contracts,
    "Payments": Payments,
    "BankAccounts": BankAccounts,
    "Analytics": Analytics,
    "Tenants": Tenants,
    "ContractDetail": ContractDetail,
    "BankReconciliation": BankReconciliation,
    "UnitDetail": UnitDetail,
    "TransactionCategories": TransactionCategories,
    "FinancialReports": FinancialReports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};