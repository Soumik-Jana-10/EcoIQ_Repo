import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import HistoryChart from '../components/HistoryChart';
import type { RoomData } from '../components/RoomCard';
import { API_URL } from '../config';

export default function RoomDetail({ user, signOut }: { user: any, signOut: (() => void) | undefined }) {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomHistory = async () => {
      if (!id) return;
      try {
        const { idToken } = (await fetchAuthSession()).tokens ?? {};
        if (!idToken) {
          throw new Error('User is not authenticated');
        }
        const token = idToken.toString();

        const response = await fetch(`${API_URL}/rooms/${id}/history`, {
          headers: {
            Authorization: token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHistory(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchRoomHistory();
    }
  }, [id, user]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 dark:bg-gray-900">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Room {id} - History
        </h1>
        <div className="flex items-center space-x-4">
            <span className="mr-4 text-gray-700 dark:text-gray-200">Welcome, {user?.signInDetails?.loginId}</span>
            <Link to="/" className="text-blue-500 hover:underline">
                Back to Dashboard
            </Link>
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
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            {history.length > 0 ? (
                <HistoryChart data={history} />
            ) : (
                <p>No historical data available for this room.</p>
            )}
        </div>
      )}
    </div>
  );
} 