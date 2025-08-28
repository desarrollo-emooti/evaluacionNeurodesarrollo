import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Users from "./Users";

import Reports from "./Reports";

import Settings from "./Settings";

import Profile from "./Profile";

import CreateUser from "./CreateUser";

import ImportUsers from "./ImportUsers";

import ExportUsers from "./ExportUsers";

import Centers from "./Centers";

import Devices from "./Devices";

import Inventory from "./Inventory";

import TestAssignment from "./TestAssignment";

import ImportTests from "./ImportTests";

import Agenda from "./Agenda";

import Authorizations from "./Authorizations";

import Payments from "./Payments";

import Statistics from "./Statistics";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Users: Users,
    
    Reports: Reports,
    
    Settings: Settings,
    
    Profile: Profile,
    
    CreateUser: CreateUser,
    
    ImportUsers: ImportUsers,
    
    ExportUsers: ExportUsers,
    
    Centers: Centers,
    
    Devices: Devices,
    
    Inventory: Inventory,
    
    TestAssignment: TestAssignment,
    
    ImportTests: ImportTests,
    
    Agenda: Agenda,
    
    Authorizations: Authorizations,
    
    Payments: Payments,
    
    Statistics: Statistics,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Users" element={<Users />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/CreateUser" element={<CreateUser />} />
                
                <Route path="/ImportUsers" element={<ImportUsers />} />
                
                <Route path="/ExportUsers" element={<ExportUsers />} />
                
                <Route path="/Centers" element={<Centers />} />
                
                <Route path="/Devices" element={<Devices />} />
                
                <Route path="/Inventory" element={<Inventory />} />
                
                <Route path="/TestAssignment" element={<TestAssignment />} />
                
                <Route path="/ImportTests" element={<ImportTests />} />
                
                <Route path="/Agenda" element={<Agenda />} />
                
                <Route path="/Authorizations" element={<Authorizations />} />
                
                <Route path="/Payments" element={<Payments />} />
                
                <Route path="/Statistics" element={<Statistics />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}