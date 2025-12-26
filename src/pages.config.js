import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import BuildingDetail from './pages/BuildingDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Buildings": Buildings,
    "BuildingDetail": BuildingDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};