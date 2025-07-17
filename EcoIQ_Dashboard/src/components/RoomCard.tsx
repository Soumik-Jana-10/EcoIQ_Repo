import React from 'react';
import { Link } from 'react-router-dom';
import ModeIndicator, { type Mode } from './ModeIndicator';

export interface RoomData {
  room_id: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  aqi: number;
  mode: Mode;
}

interface RoomCardProps {
  data: RoomData;
}

const RoomCard: React.FC<RoomCardProps> = ({ data }) => {
  const { room_id, temperature, humidity, occupancy, aqi, mode } = data;

  return (
    <Link to={`/room/${room_id}`} className="block">
        <div className="flex flex-col justify-between rounded-lg bg-white shadow p-4 dark:bg-gray-800 h-full">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Room {room_id}
                </h2>
                <ModeIndicator mode={mode} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm md:text-base">
                <div>
                <span className="font-medium">Temp:</span> {temperature}°C
                </div>
                <div>
                <span className="font-medium">Humidity:</span> {humidity}%
                </div>
                <div>
                <span className="font-medium">Occupancy:</span> {occupancy}
                </div>
                <div>
                <span className="font-medium">AQI:</span> {aqi}
                </div>
            </div>
        </div>
    </Link>
  );
};

export default RoomCard; 