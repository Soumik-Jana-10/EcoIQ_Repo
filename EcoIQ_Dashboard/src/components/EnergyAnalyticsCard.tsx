import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const pieData = [
    { name: 'Saved', value: 18 },
    { name: 'Remaining', value: 82 },
];
const COLORS = ['#38bdf8', '#e0f2fe'];

const barData = [
    { name: 'Mar', usage: 400 },
    { name: 'Feb', usage: 300 },
    { name: 'Jan', usage: 500 },
    { name: 'Apr', usage: 450 },
];

const EnergyAnalyticsCard = () => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Energy Analytics</h2>
                <div className="flex space-x-2">
                    <button className="text-gray-500 font-semibold">ecool Hub</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">Energy Saved</h3>
                    <div className="relative h-40 w-40 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={450}
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-gray-800">18%</span>
                        </div>
                    </div>
                    <p className="mt-2 text-gray-500">Save more energy</p>
                    <button className="mt-4 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg">
                        Analyze schedules to save more energy
                    </button>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="font-semibold text-gray-700 mb-2">Energy Usage by</h3>
                    <div className="h-48">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <Bar dataKey="usage" fill="#38bdf8" radius={[10, 10, 10, 10]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <button className="mt-4 text-gray-600 font-semibold">Zoom ago</button>
                </div>
            </div>
        </div>
    );
};

export default EnergyAnalyticsCard; 