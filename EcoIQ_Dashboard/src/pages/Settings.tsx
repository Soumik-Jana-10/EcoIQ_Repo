import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

interface UserProfile {
  username: string;
  email: string;
  role: string;
  name?: string;
  phoneNumber?: string;
  createdAt: string;
}

interface SystemSettings {
  temperatureUnit: 'C' | 'F';
  refreshInterval: number;
  darkMode: boolean;
  notificationsEnabled: boolean;
  temperatureThresholds: {
    min: number;
    max: number;
  };
  occupancyThreshold: number;
}

export default function Settings({ signOut }: { user?: any, signOut: (() => void) | undefined }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    temperatureUnit: 'C',
    refreshInterval: 3,
    darkMode: false,
    notificationsEnabled: true,
    temperatureThresholds: {
      min: 18,
      max: 30
    },
    occupancyThreshold: 8
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'notifications' | 'appearance'>('profile');

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current auth session
      const session = await fetchAuthSession();
      
      if (!session.tokens?.idToken) {
        throw new Error('No authentication token available');
      }
      
      // Get user attributes
      const attributes = await fetchUserAttributes();
      
      // In a real app, we might make an API call to get more user details
      // For now, we'll construct a user profile from the attributes
      const profile: UserProfile = {
        username: attributes.preferred_username || attributes.email || 'User',
        email: attributes.email || '',
        role: attributes['custom:role'] || 'User',
        name: attributes.name,
        phoneNumber: attributes.phone_number,
        createdAt: new Date(attributes.updated_at ? parseInt(attributes.updated_at) * 1000 : Date.now()).toLocaleDateString()
      };
      
      setUserProfile(profile);
      setEditedProfile(profile);
      
      // Try to load saved settings from localStorage
      const savedSettings = localStorage.getItem('ecoiq_settings');
      if (savedSettings) {
        setSystemSettings(JSON.parse(savedSettings));
      }
      
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again later.');
      
      // For demo purposes, create a mock profile
      const mockProfile: UserProfile = {
        username: 'admin@example.com',
        email: 'admin@example.com',
        role: 'Admin',
        name: 'Admin User',
        phoneNumber: '+1234567890',
        createdAt: new Date().toLocaleDateString()
      };
      
      setUserProfile(mockProfile);
      setEditedProfile(mockProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Save system settings
  const saveSettings = () => {
    try {
      // Save to localStorage
      localStorage.setItem('ecoiq_settings', JSON.stringify(systemSettings));
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    }
  };

  // Save user profile
  const saveProfile = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would make an API call to update the user profile
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserProfile(prev => prev ? { ...prev, ...editedProfile } : null);
      setEditingProfile(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile field changes
  const handleProfileChange = (field: string, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  // Handle system setting changes
  const handleSettingChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSystemSettings(prev => {
        // Create a new object with the updated nested property
        const updatedParent = { ...prev[parent as keyof typeof prev] as object };
        (updatedParent as any)[child] = value;
        
        return {
          ...prev,
          [parent]: updatedParent
        };
      });
    } else {
      setSystemSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Settings</h1>
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

      {/* Success message */}
      {saveSuccess && (
        <div className="mx-4 mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
          <p>Settings saved successfully!</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Settings tabs */}
      <div className="mx-4 mt-4 bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap">
            <button
              onClick={() => setActiveTab('profile')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Profile
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Settings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'appearance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appearance
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* User Profile Tab */}
          {activeTab === 'profile' && userProfile && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mr-4">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : userProfile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{userProfile.name || userProfile.username}</h2>
                  <p className="text-gray-600">{userProfile.role}</p>
                </div>
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={editedProfile.name || ''}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={editedProfile.phoneNumber || ''}
                      onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Username</div>
                      <div className="font-medium">{userProfile.username}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{userProfile.email}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Role</div>
                      <div className="font-medium">{userProfile.role}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Member Since</div>
                      <div className="font-medium">{userProfile.createdAt}</div>
                    </div>
                    {userProfile.phoneNumber && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Phone Number</div>
                        <div className="font-medium">{userProfile.phoneNumber}</div>
                      </div>
                    )}
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Temperature Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="temperatureUnit" className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature Unit
                    </label>
                    <select
                      id="temperatureUnit"
                      value={systemSettings.temperatureUnit}
                      onChange={(e) => handleSettingChange('temperatureUnit', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    >
                      <option value="C">Celsius (°C)</option>
                      <option value="F">Fahrenheit (°F)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature Thresholds
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="minTemp" className="block text-xs text-gray-500 mb-1">
                          Minimum (°C)
                        </label>
                        <input
                          type="number"
                          id="minTemp"
                          value={systemSettings.temperatureThresholds.min}
                          onChange={(e) => handleSettingChange('temperatureThresholds.min', parseInt(e.target.value))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                      </div>
                      <div>
                        <label htmlFor="maxTemp" className="block text-xs text-gray-500 mb-1">
                          Maximum (°C)
                        </label>
                        <input
                          type="number"
                          id="maxTemp"
                          value={systemSettings.temperatureThresholds.max}
                          onChange={(e) => handleSettingChange('temperatureThresholds.max', parseInt(e.target.value))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Occupancy Settings</h3>
                <div>
                  <label htmlFor="occupancyThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                    High Occupancy Threshold
                  </label>
                  <input
                    type="number"
                    id="occupancyThreshold"
                    value={systemSettings.occupancyThreshold}
                    onChange={(e) => handleSettingChange('occupancyThreshold', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Alert will be triggered when occupancy exceeds this value
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Data Refresh</h3>
                <div>
                  <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 mb-1">
                    Refresh Interval (seconds)
                  </label>
                  <input
                    type="number"
                    id="refreshInterval"
                    min="1"
                    max="60"
                    value={systemSettings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Enable Notifications</h4>
                      <p className="text-sm text-gray-500">
                        Receive notifications for alerts and system events
                      </p>
                    </div>
                    <button 
                      onClick={() => handleSettingChange('notificationsEnabled', !systemSettings.notificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        systemSettings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        systemSettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="notify-mode-changes"
                          type="checkbox"
                          checked={systemSettings.notificationsEnabled}
                          disabled={!systemSettings.notificationsEnabled}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notify-mode-changes" className="ml-3 text-sm text-gray-700">
                          HVAC Mode Changes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notify-system-faults"
                          type="checkbox"
                          checked={systemSettings.notificationsEnabled}
                          disabled={!systemSettings.notificationsEnabled}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notify-system-faults" className="ml-3 text-sm text-gray-700">
                          System Faults
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notify-temperature"
                          type="checkbox"
                          checked={systemSettings.notificationsEnabled}
                          disabled={!systemSettings.notificationsEnabled}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notify-temperature" className="ml-3 text-sm text-gray-700">
                          Temperature Thresholds
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notify-occupancy"
                          type="checkbox"
                          checked={systemSettings.notificationsEnabled}
                          disabled={!systemSettings.notificationsEnabled}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notify-occupancy" className="ml-3 text-sm text-gray-700">
                          High Occupancy
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Theme Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Dark Mode</h4>
                      <p className="text-sm text-gray-500">
                        Use dark theme for the dashboard
                      </p>
                    </div>
                    <button 
                      onClick={() => handleSettingChange('darkMode', !systemSettings.darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        systemSettings.darkMode ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        systemSettings.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Theme Preview</h4>
                    <div className={`p-4 rounded-lg border ${systemSettings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-medium">Room 1</div>
                        <div className={`px-2 py-1 rounded text-xs ${systemSettings.darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          Comfort Mode
                        </div>
                      </div>
                      <div className="text-3xl font-bold mb-2">22°{systemSettings.temperatureUnit}</div>
                      <div className="flex justify-between text-sm">
                        <div>Humidity: 45%</div>
                        <div>Occupancy: 3</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 