import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { fetchAuthSession } from 'aws-amplify/auth';

interface Alert {
  id: string;
  timestamp: string;
  room_id: string;
  type: 'mode_change' | 'system_fault' | 'high_occupancy' | 'temperature_threshold';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  details?: {
    oldMode?: string;
    newMode?: string;
    faultCode?: string;
    temperature?: number;
    occupancy?: number;
  };
}

export default function Alerts({ signOut }: { user?: any, signOut: (() => void) | undefined }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAcknowledged, setFilterAcknowledged] = useState<string>('all');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);

  // Function to fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Get current auth token from Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Build query parameters based on filters
      let queryParams = new URLSearchParams();
      
      if (filterSeverity !== 'all') {
        queryParams.append('severity', filterSeverity);
      }
      
      if (filterType !== 'all') {
        queryParams.append('type', filterType);
      }
      
      if (filterAcknowledged !== 'all') {
        queryParams.append('acknowledged', filterAcknowledged === 'acknowledged' ? 'true' : 'false');
      }
      
      // Make API call to fetch alerts
      const response = await axios.get(`${API_URL}alerts?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Alerts API Response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Sort alerts by timestamp (newest first)
        const sortedAlerts = [...response.data].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setAlerts(sortedAlerts);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts from DynamoDB. Please check your connection and try again.');
      
      // For development purposes only, generate mock alerts if API call fails
      if (process.env.NODE_ENV === 'development') {
        generateMockAlerts();
      }
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterType, filterAcknowledged]);

  // Initial data load
  useEffect(() => {
    fetchAlerts();
    // Try to get email from localStorage
    const savedEmail = localStorage.getItem('alertEmailAddress');
    if (savedEmail) {
      setEmailAddress(savedEmail);
    }
  }, [fetchAlerts]);

  // Set up polling interval (3 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchAlerts();
    }, 3000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchAlerts, autoRefresh]);

  // Function to toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Function to acknowledge an alert
  const acknowledgeAlert = async (id: string, timestamp: string) => {
    try {
      setLoading(true);
      
      // Get current auth token from Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Make API call to acknowledge the alert
      await axios.post(`${API_URL}alerts/${id}/acknowledge`, 
        { timestamp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === id ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() } : alert
        )
      );
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setError('Failed to acknowledge alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to save email settings
  const saveEmailSettings = () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // In a real application, this would make an API call to save the email preference
    localStorage.setItem('alertEmailAddress', emailAddress);
    setShowEmailModal(false);
  };

  // Generate mock alerts for development purposes only
  const generateMockAlerts = () => {
    const mockRooms = ['A1', 'B2', 'C3'];
    const mockAlerts: Alert[] = [];
    
    // Generate some mock alerts
    for (let i = 0; i < 10; i++) {
      const roomId = mockRooms[Math.floor(Math.random() * mockRooms.length)];
      const timestamp = new Date(Date.now() - Math.random() * 86400000).toISOString();
      const types: Alert['type'][] = ['mode_change', 'system_fault', 'high_occupancy', 'temperature_threshold'];
      const type = types[Math.floor(Math.random() * types.length)];
      const severities: Alert['severity'][] = ['info', 'warning', 'critical'];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      let message = '';
      let details = {};
      
      switch (type) {
        case 'mode_change':
          const modes = ['Eco', 'Comfort', 'Cool'];
          const newMode = modes[Math.floor(Math.random() * modes.length)];
          const oldMode = modes.filter(m => m !== newMode)[0];
          message = `Room ${roomId} HVAC mode changed to ${newMode}`;
          details = { oldMode, newMode };
          break;
        case 'system_fault':
          const faultCodes = ['F104', 'E201', 'H503'];
          const faultCode = faultCodes[Math.floor(Math.random() * faultCodes.length)];
          message = `HVAC system fault detected in Room ${roomId}`;
          details = { faultCode };
          break;
        case 'high_occupancy':
          const occupancy = Math.floor(Math.random() * 10) + 5;
          message = `High occupancy detected in Room ${roomId}`;
          details = { occupancy };
          break;
        case 'temperature_threshold':
          const temperature = severity === 'critical' ? 35 : 15;
          message = `${severity === 'critical' ? 'High' : 'Low'} temperature detected in Room ${roomId}`;
          details = { temperature };
          break;
      }
      
      mockAlerts.push({
        id: `mock-${i}-${Date.now()}`,
        timestamp,
        room_id: roomId,
        type,
        severity,
        message,
        acknowledged: Math.random() > 0.7,
        details
      });
    }
    
    // Sort by timestamp (newest first)
    mockAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setAlerts(mockAlerts);
  };

  // Apply filters
  const filteredAlerts = alerts;

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'mode_change':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'system_fault':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'high_occupancy':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'temperature_threshold':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Alerts</h1>
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

      {/* Email notification settings */}
      <div className="mx-4 mt-4 bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-lg font-medium text-gray-800">Email Notifications</h2>
          <p className="text-sm text-gray-500">
            {emailAddress ? `Alerts will be sent to: ${emailAddress}` : 'No email configured for alerts'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="email-toggle" className="mr-2">Enable:</label>
            <button 
              id="email-toggle"
              onClick={() => setEmailNotifications(!emailNotifications)} 
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${emailNotifications ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button 
            onClick={() => setShowEmailModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Configure Email
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-4 mt-4 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Filter Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="severity-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              id="severity-filter"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Alert Type
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="all">All Types</option>
              <option value="mode_change">Mode Change</option>
              <option value="system_fault">System Fault</option>
              <option value="high_occupancy">High Occupancy</option>
              <option value="temperature_threshold">Temperature Threshold</option>
            </select>
          </div>
          <div>
            <label htmlFor="acknowledged-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="acknowledged-filter"
              value={filterAcknowledged}
              onChange={(e) => setFilterAcknowledged(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="all">All Alerts</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="mx-4 my-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Alerts {filteredAlerts.length > 0 && `(${filteredAlerts.length})`}
        </h2>
        
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No alerts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterSeverity !== 'all' || filterType !== 'all' || filterAcknowledged !== 'all' 
                ? 'Try changing your filter settings to see more alerts.' 
                : 'All systems are running normally.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className={`p-4 border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500' : 
                  alert.severity === 'warning' ? 'border-yellow-500' : 'border-blue-500'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center">
                      {getAlertIcon(alert.type)}
                      <span className="ml-2 font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Room {alert.room_id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {alert.type === 'mode_change' && alert.details?.oldMode && alert.details?.newMode && (
                      <p>Mode changed from {alert.details.oldMode} to {alert.details.newMode}</p>
                    )}
                    {alert.type === 'system_fault' && alert.details?.faultCode && (
                      <p>Fault code: {alert.details.faultCode}</p>
                    )}
                    {alert.type === 'high_occupancy' && alert.details?.occupancy && (
                      <p>Current occupancy: {alert.details.occupancy} people</p>
                    )}
                    {alert.type === 'temperature_threshold' && alert.details?.temperature && (
                      <p>Current temperature: {alert.details.temperature}°C</p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                    {alert.acknowledged ? (
                      <span className="text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Acknowledged {alert.acknowledgedAt && `at ${new Date(alert.acknowledgedAt).toLocaleTimeString()}`}
                      </span>
                    ) : (
                      <button
                        onClick={() => acknowledgeAlert(alert.id, alert.timestamp)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email configuration modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Email Notifications</h3>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter your email address"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Alerts will be sent to this email address
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEmailSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 