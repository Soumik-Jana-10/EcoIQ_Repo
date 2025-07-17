import { ChevronRight } from 'lucide-react';

const OfficeCard = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Office</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-cyan-600 text-white p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xl">Hall Room</h3>
            <p className="text-5xl font-bold">24°C</p>
          </div>
          <div className="flex justify-between items-end">
            <span className="bg-cyan-700/50 text-sm rounded-full px-3 py-1">8 Adult</span>
            <button className="bg-white/30 p-2 rounded-full">
                <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow">
            <h3 className="font-semibold">Kitchen</h3>
            <p className="text-3xl font-bold">26°C</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow">
            <h3 className="font-semibold">Office</h3>
            <p className="text-3xl font-bold">23°C</p>
            <p className="text-gray-500 text-sm">Off</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficeCard; 