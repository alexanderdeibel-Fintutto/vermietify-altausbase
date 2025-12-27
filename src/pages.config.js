import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import BuildingDetail from './pages/BuildingDetail';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import BankAccounts from './pages/BankAccounts';
import Analytics from './pages/Analytics';
import Tenants from './pages/Tenants';
import ContractDetail from './pages/ContractDetail';
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};