import React from 'react';

export type Mode = 'Eco' | 'Comfort' | 'Cool';

interface ModeIndicatorProps {
  mode: Mode;
}

const modeColors: Record<Mode, string> = {
  Eco: 'bg-green-500',
  Comfort: 'bg-blue-500',
  Cool: 'bg-red-500',
};

const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode }) => {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${modeColors[mode]}`}
    >
      {mode}
    </span>
  );
};

export default ModeIndicator; 