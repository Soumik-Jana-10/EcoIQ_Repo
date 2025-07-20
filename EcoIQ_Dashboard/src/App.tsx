import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import RoomDetail from './pages/RoomDetail';
import Auth from './pages/Auth';
import EnergyAnalytics from './pages/EnergyAnalytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import UsersDashboard from './pages/UsersDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import RoleSelect from './pages/RoleSelect';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

const AppRoutes = () => {
  const { signOut, user } = useAuthenticator((context) => [context.user]);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
    signOut();
  };

  const handleRoleSelect = (role: string) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  };

  if (!userRole) {
    return <RoleSelect onRoleSelect={handleRoleSelect} signOut={handleSignOut} />;
  }

  const DashboardComponent = () => {
    switch (userRole) {
      case 'Admin':
        return <AdminDashboard signOut={handleSignOut} user={user} />;
      case 'Technician':
        return <TechnicianDashboard signOut={handleSignOut} user={user} />;
      default:
        return <UsersDashboard signOut={handleSignOut} user={user} />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={<DashboardComponent />} />
      <Route path="/admin" element={userRole === 'Admin' ? <AdminDashboard signOut={handleSignOut} user={user} /> : <Navigate to="/" />} />
      <Route path="/technician" element={userRole === 'Technician' ? <TechnicianDashboard signOut={handleSignOut} user={user} /> : <Navigate to="/" />} />
      <Route path="/room/:id" element={<RoomDetail signOut={handleSignOut} user={user} />} />
      <Route path="/energy" element={<EnergyAnalytics signOut={handleSignOut} />} />
      <Route path="/alerts" element={<Alerts signOut={handleSignOut} />} />
      <Route path="/settings" element={<Settings signOut={handleSignOut} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  return (
    <BrowserRouter>
      {authStatus !== 'authenticated' ? <Auth /> : <AppRoutes />}
    </BrowserRouter>
  );
}

export default App;
