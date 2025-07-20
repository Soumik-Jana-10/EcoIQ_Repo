import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { fetchAuthSession } from 'aws-amplify/auth';

interface RoomData {
  room_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  aqi: number;
  mode: 'Eco' | 'Comfort' | 'Cool';
}

interface SystemStatus {
  hvacHealth: 'good' | 'warning' | 'critical';
  lastMaintenance: string;
  nextMaintenance: string;
  alerts: number;
}

export default function TechnicianDashboard({ user, signOut }: { user?: any, signOut?: () => void }) {
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [systemStatus, ] = useState<SystemStatus>({
    hvacHealth: 'good',
    lastMaintenance: '2024-02-20',
    nextMaintenance: '2024-03-20',
    alerts: 0
  });

  const fetchRoomsData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error('No auth token');

      const response = await axios.get(`${API_URL}rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setRoomsData(response.data);
        if (!selectedRoom && response.data.length > 0) {
          setSelectedRoom(response.data[0].room_id);
        }
      }
    } catch (e) {
      setError('Failed to load room data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  useEffect(() => {
    fetchRoomsData();
    // In a real app, we would fetch real system status
    const interval = setInterval(fetchRoomsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchRoomsData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">Loading system data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Technician Dashboard</h1>
          <p className="text-blue-200 text-sm">System Maintenance Interface</p>
        </div>
        <nav className="flex items-center space-x-6 mt-4 md:mt-0">
          {user && (
            <span className="text-sm text-blue-200">Logged in as: {user.username}</span>
          )}
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

      {/* System Status Overview */}
      <div className="p-6">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* HVAC Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">HVAC System Health</h3>
            <div className={`text-2xl font-bold ${
              systemStatus.hvacHealth === 'good' ? 'text-green-600' :
              systemStatus.hvacHealth === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {systemStatus.hvacHealth.toUpperCase()}
            </div>
          </div>

          {/* Last Maintenance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Last Maintenance</h3>
            <div className="text-2xl font-bold text-gray-700">
              {new Date(systemStatus.lastMaintenance).toLocaleDateString()}
            </div>
          </div>

          {/* Next Scheduled Maintenance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Next Maintenance</h3>
            <div className="text-2xl font-bold text-blue-600">
              {new Date(systemStatus.nextMaintenance).toLocaleDateString()}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Active Alerts</h3>
            <div className="text-2xl font-bold text-red-600">
              {systemStatus.alerts}
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomsData.map((room) => (
            <div 
              key={room.room_id}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedRoom(room.room_id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-medium text-gray-800">Room {room.room_id}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  room.temperature > 25 ? 'bg-red-100 text-red-800' :
                  room.temperature < 18 ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {room.mode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Temperature</p>
                  <p className="text-xl font-bold text-gray-800">{room.temperature}°C</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Humidity</p>
                  <p className="text-xl font-bold text-gray-800">{room.humidity}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">AQI</p>
                  <p className="text-xl font-bold text-gray-800">{room.aqi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupancy</p>
                  <p className="text-xl font-bold text-gray-800">{room.occupancy}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <button 
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Maintenance mode would be implemented here');
                  }}
                >
                  Enter Maintenance Mode
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 