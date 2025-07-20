import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

export default function Dashboard({ user, signOut }: { user: any, signOut: (() => void) | undefined }) {
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<RoomData[]>([]);
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
      
      console.log('API Response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setRoomsData(response.data);
        setLastUpdated(new Date());
        
        // If we have rooms and no room is selected yet, select the first one
        if (response.data.length > 0 && !selectedRoom) {
          setSelectedRoom(response.data[0].room_id);
        }
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load room data from DynamoDB. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  // Function to fetch historical data
  const fetchHistoricalData = useCallback(async () => {
    if (!selectedRoom) return;

    try {
      setError(null);
      
      // Get current auth token from Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await axios.get(`${API_URL}rooms/${selectedRoom}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Historical Data Response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Sort data by timestamp
        const sortedData = [...response.data].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setHistoricalData(sortedData);
      } else {
        throw new Error('Invalid historical data format received from API');
      }
    } catch (err) {
      console.error(`Error fetching historical data for room ${selectedRoom}:`, err);
      setError(`Failed to load historical data for Room ${selectedRoom} from DynamoDB.`);
    }
  }, [selectedRoom]);

  // Initial data load
  useEffect(() => {
    fetchRoomsData();
  }, [fetchRoomsData]);

  // Set up polling interval (3 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchRoomsData();
      if (selectedRoom) {
        fetchHistoricalData();
      }
    }, 3000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchRoomsData, fetchHistoricalData, selectedRoom, autoRefresh]);

  // Fetch historical data when selected room changes
  useEffect(() => {
    if (selectedRoom) {
      fetchHistoricalData();
    }
  }, [selectedRoom, fetchHistoricalData]);

  // Format historical data for the chart
  const chartData = historicalData.map(item => {
    // Format timestamp to date string
    const date = new Date(item.timestamp);
    return {
      ...item,
      formattedDate: `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };
  });

  // Function to handle manual override
  const handleManualOverride = () => {
    alert('Manual override functionality would be implemented here');
  };

  // Function to toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Function to handle room selection change
  const handleRoomChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoom(event.target.value);
  };

  if (loading && roomsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading data from DynamoDB...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Indoor Environment Control</h1>
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

      {/* Last updated indicator */}
      <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 flex justify-between items-center">
        <div>
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

      {/* Empty state */}
      {!loading && roomsData.length === 0 && (
        <div className="p-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Room Data Available</h2>
            <p className="text-gray-600 mb-4">
              There is no data in your DynamoDB table. You need to add data to display rooms.
            </p>
            <p className="text-sm text-gray-500">
              You can use the data simulation script to add test data to your database.
            </p>
          </div>
        </div>
      )}

      {/* Room Cards Grid */}
      {roomsData.length > 0 && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roomsData.map((room) => (
            <div 
              key={room.room_id} 
              className={`${selectedRoom === room.room_id ? 'ring-2 ring-blue-500' : ''} bg-blue-800 text-white p-6 rounded-lg cursor-pointer`}
              onClick={() => setSelectedRoom(room.room_id)}
            >
              <h2 className="text-xl font-medium mb-6">Room {room.room_id}</h2>
              
              <div className="flex justify-center">
                <div className="text-7xl font-bold">
                  {room.temperature}
                  <span className="text-3xl">°F</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>{room.humidity}%</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{room.occupancy} occupancy</span>
                </div>
              </div>
              
              <div className="mt-6">
                <div className={`text-center py-2 rounded-md ${
                  room.mode === 'Eco' ? 'bg-green-500' : 
                  room.mode === 'Comfort' ? 'bg-blue-400' : 'bg-cyan-300 text-blue-900'
                }`}>
                  {room.mode === 'Eco' ? 'Energy-Saving Mode' : 
                  room.mode === 'Comfort' ? 'Comfort Mode' : 'Cool Mode'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historical Data Chart */}
      {roomsData.length > 0 && (
        <div className="mx-4 my-8 p-6 bg-white rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-800 mr-4">Historical Data</h2>
              <div className="relative">
                <select
                  value={selectedRoom || ''}
                  onChange={handleRoomChange}
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                >
                  {roomsData.map(room => (
                    <option key={room.room_id} value={room.room_id}>
                      Room {room.room_id}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            <button 
              onClick={handleManualOverride}
              className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-lg"
            >
              Manual Override
            </button>
          </div>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#F59E0B" 
                    name="Temperature" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aqi" 
                    stroke="#10B981" 
                    name="AQI" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#3B82F6" 
                    name="Occupancy" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No historical data available for the selected room</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 