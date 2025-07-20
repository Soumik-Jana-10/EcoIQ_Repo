import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { fetchAuthSession } from 'aws-amplify/auth';

interface EnergyData {
  room_id: string;
  timestamp: string;
  consumption: number;
  savings: number;
  mode: 'Eco' | 'Comfort' | 'Cool';
}

interface RoomData {
  room_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  aqi: number;
  mode: 'Eco' | 'Comfort' | 'Cool';
}

export default function EnergyAnalytics({ signOut }: { user?: any, signOut: (() => void) | undefined }) {
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Function to fetch rooms data
  const fetchRoomsData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Get current auth token from Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await axios.get(`${API_URL}rooms`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setRoomsData(response.data);
        
        // Generate mock energy data based on room data
        // In a real application, this would come from a separate API endpoint
        const mockEnergyData: EnergyData[] = response.data.map(room => ({
          room_id: room.room_id,
          timestamp: room.timestamp,
          consumption: room.mode === 'Eco' ? Math.random() * 2 + 1 : 
                      room.mode === 'Comfort' ? Math.random() * 3 + 3 : 
                      Math.random() * 4 + 6,
          savings: room.mode === 'Eco' ? Math.random() * 3 + 2 : 
                  room.mode === 'Comfort' ? Math.random() * 2 + 1 : 0,
          mode: room.mode
        }));
        
        setEnergyData(mockEnergyData);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load energy data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchRoomsData();
  }, [fetchRoomsData]);

  // Set up polling interval (3 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchRoomsData();
    }, 3000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchRoomsData, autoRefresh]);

  // Function to toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Calculate total energy consumption
  const totalConsumption = energyData.reduce((sum, data) => sum + data.consumption, 0).toFixed(2);
  
  // Calculate total energy savings
  const totalSavings = energyData.reduce((sum, data) => sum + data.savings, 0).toFixed(2);
  
  // Calculate percentage of rooms in each mode
  const roomModes = roomsData.reduce((acc, room) => {
    acc[room.mode] = (acc[room.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const modeData = [
    { name: 'Eco', value: roomModes['Eco'] || 0, color: '#10B981' },
    { name: 'Comfort', value: roomModes['Comfort'] || 0, color: '#3B82F6' },
    { name: 'Cool', value: roomModes['Cool'] || 0, color: '#06B6D4' }
  ];

  // Energy consumption by room
  const consumptionByRoom = energyData.map(data => ({
    name: `Room ${data.room_id}`,
    consumption: parseFloat(data.consumption.toFixed(2)),
    savings: parseFloat(data.savings.toFixed(2))
  }));

  if (loading && roomsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading energy data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Energy Analytics</h1>
        <nav className="flex flex-wrap gap-3 md:gap-6">
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

      {/* Last updated indicator */}
      <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-2 md:mb-0">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="flex items-center space-x-4">
          {loading && <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing...
          </div>}
          <div className="flex items-center">
            <label htmlFor="auto-refresh" className="mr-2">Auto-refresh:</label>
            <button 
              id="auto-refresh"
              onClick={toggleAutoRefresh} 
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${autoRefresh ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Time range selector */}
      <div className="mx-4 mt-4 flex justify-end">
        <div className="inline-flex rounded-md shadow">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              timeRange === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Energy summary cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Total Energy Consumption</h2>
          <div className="text-4xl font-bold text-blue-600">{totalConsumption} kWh</div>
          <p className="text-sm text-gray-500 mt-2">For the selected {timeRange}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Total Energy Savings</h2>
          <div className="text-4xl font-bold text-green-600">{totalSavings} kWh</div>
          <p className="text-sm text-gray-500 mt-2">For the selected {timeRange}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Efficiency Score</h2>
          <div className="text-4xl font-bold text-purple-600">
            {Math.min(100, Math.round((parseFloat(totalSavings) / (parseFloat(totalConsumption) + parseFloat(totalSavings))) * 100))}%
          </div>
          <p className="text-sm text-gray-500 mt-2">Higher is better</p>
        </div>
      </div>

      {/* Charts */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy consumption by room */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Energy Consumption by Room</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionByRoom}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="consumption" name="Consumption (kWh)" fill="#3B82F6" />
                <Bar dataKey="savings" name="Savings (kWh)" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room mode distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Room Mode Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            {modeData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent ? (percent * 100).toFixed(0) : '0')}%`}
                  >
                    {modeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No mode data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Energy consumption trend */}
      <div className="mx-4 mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Energy Consumption Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={energyData.map(data => ({
              timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              room: `Room ${data.room_id}`,
              consumption: parseFloat(data.consumption.toFixed(2))
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="consumption" name="Energy (kWh)" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 