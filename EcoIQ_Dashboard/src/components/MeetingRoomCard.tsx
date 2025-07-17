import { ArrowRight, Users, User } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: '24 h', temp: 21 },
  { name: '20 h', temp: 20 },
  { name: '16 h', temp: 22 },
  { name: '12 h', temp: 21.5 },
  { name: '8 h', temp: 23 },
  { name: '4 h', temp: 24 },
  { name: 'Now', temp: 23 },
];

const MeetingRoomCard = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Meeting Room</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <ArrowRight size={20} />
        </button>
      </div>

      <p className="text-gray-500 mb-2">Temperature</p>
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
            <Tooltip />
            <Line type="monotone" dataKey="temp" stroke="#38bdf8" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <User size={16} />
          <span>1</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>3</span>
        </div>
        <div>
          <span>Temperature: <strong>23°C</strong></span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">Auto</span>
        <div className="w-24 h-4 bg-gray-200 rounded-full">
            <div className="h-4 bg-cyan-500 rounded-full" style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoomCard; 