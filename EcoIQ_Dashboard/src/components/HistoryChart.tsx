import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RoomData } from './RoomCard';

interface HistoryChartProps {
  data: RoomData[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    ...item,
    // Format timestamp for better readability if needed
    // timestamp: new Date(item.timestamp).toLocaleTimeString(), 
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="humidity" stroke="#82ca9d" />
        <Line type="monotone" dataKey="aqi" stroke="#ffc658" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default HistoryChart; 