import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RoomDetail from './pages/RoomDetail';
import Auth from './pages/Auth';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

// Placeholder components for new routes
const EnergyAnalytics = ({ signOut }: { signOut: (() => void) | undefined }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <header className="bg-blue-900 text-white p-4 flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Energy Analytics</h1>
      <nav className="flex space-x-6">
        <Link to="/" className="text-white hover:text-blue-200">Dashboard</Link>
        <Link to="/energy" className="text-white hover:text-blue-200">Energy Analytics</Link>
        <Link to="/alerts" className="text-white hover:text-blue-200">Alerts</Link>
        <Link to="/settings" className="text-white hover:text-blue-200">Settings</Link>
        {signOut && (
          <button 
            onClick={signOut} 
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
          >
            Sign Out
          </button>
        )}
      </nav>
    </header>
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Energy Analytics Dashboard</h2>
      <p>This page is under construction. Energy analytics will be displayed here.</p>
    </div>
  </div>
);

const Alerts = ({ signOut }: { signOut: (() => void) | undefined }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <header className="bg-blue-900 text-white p-4 flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Alerts</h1>
      <nav className="flex space-x-6">
        <Link to="/" className="text-white hover:text-blue-200">Dashboard</Link>
        <Link to="/energy" className="text-white hover:text-blue-200">Energy Analytics</Link>
        <Link to="/alerts" className="text-white hover:text-blue-200">Alerts</Link>
        <Link to="/settings" className="text-white hover:text-blue-200">Settings</Link>
        {signOut && (
          <button 
            onClick={signOut} 
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
          >
            Sign Out
          </button>
        )}
      </nav>
    </header>
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Alerts Dashboard</h2>
      <p>This page is under construction. System alerts will be displayed here.</p>
    </div>
  </div>
);

const Settings = ({ signOut }: { signOut: (() => void) | undefined }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <header className="bg-blue-900 text-white p-4 flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <nav className="flex space-x-6">
        <Link to="/" className="text-white hover:text-blue-200">Dashboard</Link>
        <Link to="/energy" className="text-white hover:text-blue-200">Energy Analytics</Link>
        <Link to="/alerts" className="text-white hover:text-blue-200">Alerts</Link>
        <Link to="/settings" className="text-white hover:text-blue-200">Settings</Link>
        {signOut && (
          <button 
            onClick={signOut} 
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
          >
            Sign Out
          </button>
        )}
      </nav>
    </header>
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">System Settings</h2>
      <p>This page is under construction. System settings will be displayed here.</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { signOut, user } = useAuthenticator((context) => [context.user]);
  return (
    <Routes>
      <Route path="/" element={<Dashboard signOut={signOut} user={user} />} />
      <Route path="/room/:id" element={<RoomDetail signOut={signOut} user={user} />} />
      <Route path="/energy" element={<EnergyAnalytics signOut={signOut} />} />
      <Route path="/alerts" element={<Alerts signOut={signOut} />} />
      <Route path="/settings" element={<Settings signOut={signOut} />} />
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
