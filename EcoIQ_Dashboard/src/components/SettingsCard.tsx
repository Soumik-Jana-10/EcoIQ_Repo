import { ChevronRight } from 'lucide-react';

const SettingsCard = () => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Child</span>
                    <div className="flex items-center space-x-3">
                        <input type="range" min="18" max="30" defaultValue="23" className="w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-bold text-gray-800">23°C</span>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Adult</span>
                    <div className="flex items-center space-x-3">
                        <input type="range" min="18" max="30" defaultValue="22" className="w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-bold text-gray-800">22°C</span>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Elder</span>
                    <div className="flex items-center space-x-3">
                        <input type="range" min="18" max="30" defaultValue="24" className="w-32 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-bold text-gray-800">24°C</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t pt-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">System Schedule</span>
                     <button className="relative w-12 h-6 bg-cyan-500 rounded-full">
                        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform translate-x-6"></span>
                    </button>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Zones</span>
                    <button className="text-gray-400 hover:text-gray-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsCard; 