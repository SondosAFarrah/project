import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';

interface Client {
  id: number;
  status: 'idle' | 'training' | 'error' | 'updated' | 'timeout';
  lastUpdate: Date;
  progress?: number;
}

interface DashboardProps {
  clients: Client[];
  serverStatus: 'idle' | 'aggregating' | 'distributing';
}

const Dashboard: React.FC<DashboardProps> = ({ clients, serverStatus }) => {
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

  const getStatusCount = (status: string) => {
    return clients.filter(client => client.status === status).length;
  };

  const serverProps = useSpring({
    from: { scale: 1 },
    to: { scale: serverStatus !== 'idle' ? 1.05 : 1 },
    config: { duration: 800 },
    loop: serverStatus !== 'idle',
  });

  return (
    <div className="bg-slate-800 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">Federated Learning Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Status */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-xl mb-4">Server Status</h3>
          <div className="flex items-center justify-center mb-4">
            <animated.div 
              style={{ 
                ...serverProps,
                backgroundColor: getStatusColor(serverStatus),
              }}
              className="w-24 h-24 rounded-full flex items-center justify-center"
            >
              <span className="capitalize font-bold">{serverStatus}</span>
            </animated.div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-300">Total Clients</div>
              <div className="text-2xl font-bold">{clients.length}</div>
            </div>
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-300">Active</div>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.status !== 'idle' && c.status !== 'error').length}
              </div>
            </div>
          </div>
        </div>
        
        {/* Client Status Summary */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-xl mb-4">Client Status</h3>
          <div className="space-y-3">
            {['training', 'updated', 'error', 'timeout', 'idle'].map(status => (
              <div key={status} className="flex items-center">
                <motion.div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getStatusColor(status) }}
                  animate={{ 
                    scale: [1, status === 'training' ? 1.5 : 1, 1],
                    opacity: [1, status === 'training' ? 0.7 : 1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="flex-1 capitalize">{status}</div>
                <div className="font-bold">{getStatusCount(status)}</div>
                <div className="w-16 bg-slate-600 h-2 rounded-full ml-2">
                  <motion.div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${(getStatusCount(status) / clients.length) * 100}%`,
                      backgroundColor: getStatusColor(status)
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(getStatusCount(status) / clients.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Client List */}
        <div className="bg-slate-700 rounded-lg p-4 md:col-span-2">
          <h3 className="text-xl mb-4">Client Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {clients.map(client => (
                <motion.div
                  key={client.id}
                  className="bg-slate-600 rounded-lg p-3 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold">Client {client.id}</div>
                    <div 
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: getStatusColor(client.status) }}
                    >
                      {client.status}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-300 mb-2">
                    Last update: {client.lastUpdate.toLocaleTimeString()}
                  </div>
                  
                  {client.progress !== undefined && (
                    <div className="w-full bg-slate-700 h-1 rounded-full mt-2">
                      <motion.div 
                        className="h-full rounded-full" 
                        style={{ backgroundColor: getStatusColor(client.status) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${client.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                  
                  {client.status === 'training' && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-1 bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
