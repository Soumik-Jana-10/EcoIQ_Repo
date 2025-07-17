import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import RoomCard, { type RoomData } from '../components/RoomCard';

const API_URL = 'https://zfpub451b6.execute-api.eu-north-1.amazonaws.com/prod/rooms';

export default function Dashboard({ user, signOut }: { user: any, signOut: (() => void) | undefined }) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const { idToken } = (await fetchAuthSession()).tokens ?? {};
        if (!idToken) {
          throw new Error('User is not authenticated');
        }
        const token = idToken.toString();

        const response = await fetch(API_URL, {
          headers: {
            Authorization: token,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRooms(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 dark:bg-gray-900">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
          Indoor Environment Dashboard
        </h1>
        <div className="flex items-center">
            <span className="mr-4 text-gray-700 dark:text-gray-200">Welcome, {user?.signInDetails?.loginId}</span>
            <button
                onClick={signOut}
                className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
                Sign Out
            </button>
        </div>
      </header>

      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room.room_id} data={room} />
          ))}
        </div>
      )}
    </div>
  );
} 