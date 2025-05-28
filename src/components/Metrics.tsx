import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface Client {
  id: number;
  status: 'idle' | 'training' | 'error' | 'updated' | 'timeout';
  lastUpdate: Date;
  accuracy?: number;
  loss?: number;
}

interface MetricsProps {
  clients: Client[];
  historyData: {
    timestamp: number;
    activeClients: number;
    accuracy: number;
    loss: number;
  }[];
}

const Metrics: React.FC<MetricsProps> = ({ clients, historyData }) => {
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'loss'>('accuracy');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return '#64748b';
      case 'training': return '#3b82f6';
      case 'error': return '#ef4444';
      case 'updated': return '#22c55e';
      case 'timeout': return '#f59e0b';
      case 'aggregating': return '#8b5cf6';
      case 'distributing': return '#06b6d4';
      default: return '#64748b';
    }
  };

  const activeClientsProps = useSpring({
    number: clients.filter(c => c.status === 'training' || c.status === 'updated').length,
    from: { number: 0 },
  });

  const accuracyProps = useSpring({
    number: historyData.length > 0 ? historyData[historyData.length - 1].accuracy : 0,
    from: { number: 0 },
  });

  const lossProps = useSpring({
    number: historyData.length > 0 ? historyData[historyData.length - 1].loss : 0,
    from: { number: 0 },
  });

  return (
    <div className="bg-slate-800 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Federated Learning Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Active Clients Card */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="text-slate-300 mb-1">Active Clients</div>
          <div className="flex items-end">
            <animated.div className="text-3xl font-bold">
              {activeClientsProps.number.to(n => Math.floor(n))}
            </animated.div>
            <div className="text-slate-400 ml-2">/ {clients.length}</div>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded-full mt-2">
            <motion.div 
              className="h-full rounded-full bg-blue-500" 
              initial={{ width: 0 }}
              animate={{ 
                width: `${(clients.filter(c => c.status === 'training' || c.status === 'updated').length / clients.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* Accuracy Card */}
        <div 
          className={`bg-slate-700 rounded-lg p-4 cursor-pointer ${selectedMetric === 'accuracy' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setSelectedMetric('accuracy')}
        >
          <div className="text-slate-300 mb-1">Global Accuracy</div>
          <div className="flex items-end">
            <animated.div className="text-3xl font-bold text-green-500">
              {accuracyProps.number.to(n => n.toFixed(2))}
            </animated.div>
            <div className="text-slate-400 ml-2">%</div>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded-full mt-2">
            <motion.div 
              className="h-full rounded-full bg-green-500" 
              initial={{ width: 0 }}
              animate={{ 
                width: `${historyData.length > 0 ? historyData[historyData.length - 1].accuracy : 0}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* Loss Card */}
        <div 
          className={`bg-slate-700 rounded-lg p-4 cursor-pointer ${selectedMetric === 'loss' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setSelectedMetric('loss')}
        >
          <div className="text-slate-300 mb-1">Global Loss</div>
          <div className="flex items-end">
            <animated.div className="text-3xl font-bold text-red-500">
              {lossProps.number.to(n => n.toFixed(4))}
            </animated.div>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded-full mt-2">
            <motion.div 
              className="h-full rounded-full bg-red-500" 
              initial={{ width: 0 }}
              animate={{ 
                width: `${historyData.length > 0 ? Math.min(historyData[historyData.length - 1].loss * 100, 100) : 0}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
      
      {/* Main Chart */}
      <div className="bg-slate-700 rounded-lg p-4 h-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl">Training Progress</h3>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-full text-sm ${selectedMetric === 'accuracy' ? 'bg-green-500 text-white' : 'bg-slate-600'}`}
              onClick={() => setSelectedMetric('accuracy')}
            >
              Accuracy
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-sm ${selectedMetric === 'loss' ? 'bg-red-500 text-white' : 'bg-slate-600'}`}
              onClick={() => setSelectedMetric('loss')}
            >
              Loss
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="85%">
          {selectedMetric === 'accuracy' ? (
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} 
                stroke="#94a3b8"
              />
              <YAxis domain={[0, 100]} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
                formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Accuracy']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Area 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorAccuracy)" 
                animationDuration={500}
              />
            </AreaChart>
          ) : (
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} 
                stroke="#94a3b8"
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
                formatter={(value: any) => [Number(value).toFixed(4), 'Loss']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Area 
                type="monotone" 
                dataKey="loss" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorLoss)" 
                animationDuration={500}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Client Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-xl mb-4">Client Performance</h3>
          <div className="space-y-4">
            {clients
              .filter(client => client.accuracy !== undefined && client.loss !== undefined)
              .map(client => (
                <div key={client.id} className="bg-slate-600 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold">Client {client.id}</div>
                    <div 
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: getStatusColor(client.status) }}
                    >
                      {client.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-300 mb-1">Accuracy</div>
                      <div className="flex items-center">
                        <div className="font-bold">{client.accuracy?.toFixed(2)}%</div>
                        <div className="w-full bg-slate-700 h-1 rounded-full ml-2">
                          <motion.div 
                            className="h-full rounded-full bg-green-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${client.accuracy}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-slate-300 mb-1">Loss</div>
                      <div className="flex items-center">
                        <div className="font-bold">{client.loss?.toFixed(4)}</div>
                        <div className="w-full bg-slate-700 h-1 rounded-full ml-2">
                          <motion.div 
                            className="h-full rounded-full bg-red-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(client.loss! * 100, 100)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-xl mb-4">Active Clients History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} 
                stroke="#94a3b8"
              />
              <YAxis domain={[0, clients.length]} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
                formatter={(value: any) => [value, 'Active Clients']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Line 
                type="monotone" 
                dataKey="activeClients" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
