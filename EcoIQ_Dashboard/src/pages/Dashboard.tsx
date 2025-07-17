import OfficeCard from '../components/OfficeCard';
import MeetingRoomCard from '../components/MeetingRoomCard';
import EnergyAnalyticsCard from '../components/EnergyAnalyticsCard';
import SettingsCard from '../components/SettingsCard';

export default function Dashboard({ user, signOut }: { user: any, signOut: (() => void) | undefined }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hi, Welcome back!
          </h1>
          <p className="text-gray-500">Your eco-dashboard</p>
        </div>
        <div className="flex items-center">
            <span className="mr-4 text-gray-700">Welcome, {user?.signInDetails?.loginId}</span>
            <button
                onClick={signOut}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
            >
                Sign Out
            </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OfficeCard />
          <EnergyAnalyticsCard />
        </div>
        <div className="space-y-8">
          <MeetingRoomCard />
          <SettingsCard />
        </div>
      </main>
    </div>
  );
} 