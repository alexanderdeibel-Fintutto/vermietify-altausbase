import Analytics from './pages/Analytics';
import BankAccounts from './pages/BankAccounts';
import BankReconciliation from './pages/BankReconciliation';
import BankTransactions from './pages/BankTransactions';
import BuildingDetail from './pages/BuildingDetail';
import Buildings from './pages/Buildings';
import ContractDetail from './pages/ContractDetail';
import Contracts from './pages/Contracts';
import Dashboard from './pages/Dashboard';
import FinAPICallback from './pages/FinAPICallback';
import FinancialItems from './pages/FinancialItems';
import UnitDetail from './pages/UnitDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "BankAccounts": BankAccounts,
    "BankReconciliation": BankReconciliation,
    "BankTransactions": BankTransactions,
    "BuildingDetail": BuildingDetail,
    "Buildings": Buildings,
    "ContractDetail": ContractDetail,
    "Contracts": Contracts,
    "Dashboard": Dashboard,
    "FinAPICallback": FinAPICallback,
    "FinancialItems": FinancialItems,
    "UnitDetail": UnitDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};