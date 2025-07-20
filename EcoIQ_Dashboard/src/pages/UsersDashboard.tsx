import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export default function UsersDashboard({ user, signOut }: { user?: any, signOut?: () => void }) {
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        throw new Error('Invalid room data');
      }
    } catch (e) {
      setError('Failed to load room data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  const fetchHistoricalData = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error('No auth token');
      const response = await axios.get(`${API_URL}rooms/${selectedRoom}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        const sorted = [...response.data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setHistoricalData(sorted);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load historical data');
    }
  }, [selectedRoom]);

  useEffect(() => {
    fetchRoomsData();
  }, [fetchRoomsData]);

  useEffect(() => {
    if (selectedRoom) fetchHistoricalData();
  }, [selectedRoom, fetchHistoricalData]);

  const selectedRoomData = roomsData.find(r => r.room_id === selectedRoom);

  // Chart data formatting
  const chartData = historicalData.map(item => {
    const date = new Date(item.timestamp);
    return { ...item, time: `${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}` };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-red-600">{error}</span>
      </div>
    );
  }

  if (!selectedRoomData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">No room data available.</span>
      </div>
    );
  }

  const modeBadgeColor = selectedRoomData.mode === 'Eco' ? 'bg-green-500' : selectedRoomData.mode === 'Comfort' ? 'bg-blue-500' : 'bg-cyan-500';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Navigation */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Indoor Environment Control</h1>
        <nav className="space-x-8 text-gray-600 flex items-center">
          <Link to="/" className="font-semibold text-gray-900">Dashboard</Link>
          <Link to={`/room/${selectedRoom}`} className="hover:text-gray-900">History</Link>
          {user && (
            <span className="text-sm text-gray-700 mr-2">{user?.username}</span>
          )}
          {signOut && (
            <button onClick={signOut} className="ml-4 bg-red-600 text-white px-3 py-1 rounded">Sign Out</button>
          )}
        </nav>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow p-6 md:p-10">
        {/* Room Heading */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Room {selectedRoom}</h2>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 text-center">
          {/* Temperature */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-gray-800 mb-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.76V3.5a2.5 2.5 0 10-5 0v11.26a5 5 0 105 0z"></path>
              </svg>
              <span className="text-xl font-medium">{selectedRoomData.temperature.toFixed(1)}°C</span>
            </div>
            <span className={`${modeBadgeColor} text-white text-xs px-2 py-1 rounded-full capitalize`}>{selectedRoomData.mode}</span>
          </div>

          {/* Humidity */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-gray-800 mb-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l5.5 9a6.5 6.5 0 11-11 0l5.5-9z"></path>
              </svg>
              <span className="text-xl font-medium">{selectedRoomData.humidity}%</span>
            </div>
            <span className="text-sm text-gray-500">Humidity</span>
          </div>

          {/* Occupancy */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-gray-800 mb-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xl font-medium">{selectedRoomData.occupancy}</span>
            </div>
            <span className="text-sm text-gray-500">Occupancy</span>
          </div>

          {/* AQI */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-gray-800 mb-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4h1m6 0h1a4 4 0 014 4M7 15v1a5 5 0 005 5 5 5 0 005-5v-1M7 15H3m14 0h4"></path>
              </svg>
              <span className="text-xl font-medium">{selectedRoomData.aqi}</span>
            </div>
            <span className="text-sm text-gray-500">AQI</span>
          </div>

          {/* Mode value (optional numeric or code) */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-gray-800 mb-2">{selectedRoomData.temperature > 30 ? 'Cool' : selectedRoomData.mode}</span>
            <span className="text-sm text-gray-500">Mode</span>
          </div>
        </div>

        {/* Temperature Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" name="Temperature" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="aqi" name="AQI" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="occupancy" name="Occupancy" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No chart data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 