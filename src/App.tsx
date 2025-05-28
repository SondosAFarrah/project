import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NetworkGraph from './components/NetworkGraph';
import Dashboard from './components/Dashboard';
import Metrics from './components/Metrics';
import './App.css';

// Define client status types
type ClientStatus = 'idle' | 'training' | 'error' | 'updated' | 'timeout';
type ServerStatus = 'idle' | 'aggregating' | 'distributing';

// Client interface
interface Client {
  id: number;
  status: ClientStatus;
  lastUpdate: Date;
  progress?: number;
  accuracy?: number;
  loss?: number;
}

// History data point interface
interface HistoryDataPoint {
  timestamp: number;
  activeClients: number;
  accuracy: number;
  loss: number;
}

function App() {
  // State for active view
  const [activeView, setActiveView] = useState<'network' | 'dashboard' | 'metrics'>('network');
  
  // State for clients and server
  const [clients, setClients] = useState<Client[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);

  // Generate initial sample data
  useEffect(() => {
    // Create sample clients
    const sampleClients: Client[] = [];
    for (let i = 1; i <= 8; i++) {
      sampleClients.push({
        id: i,
        status: ['idle', 'training', 'updated', 'error', 'timeout'][Math.floor(Math.random() * 5)] as ClientStatus,
        lastUpdate: new Date(),
        progress: Math.random() * 100,
        accuracy: 70 + Math.random() * 25,
        loss: 0.1 + Math.random() * 0.3
      });
    }
    setClients(sampleClients);

    // Create sample history data
    const now = Date.now();
    const sampleHistory: HistoryDataPoint[] = [];
    for (let i = 0; i < 20; i++) {
      sampleHistory.push({
        timestamp: now - (19 - i) * 60000, // One minute intervals
        activeClients: 3 + Math.floor(Math.random() * 5),
        accuracy: 50 + i * 2 + Math.random() * 5,
        loss: 0.5 - i * 0.02 + Math.random() * 0.05
      });
    }
    setHistoryData(sampleHistory);

    // Simulate server and client status changes
    const interval = setInterval(() => {
      // Update server status
      setServerStatus(prev => {
        const statuses: ServerStatus[] = ['idle', 'aggregating', 'distributing'];
        const currentIndex = statuses.indexOf(prev);
        return statuses[(currentIndex + 1) % statuses.length];
      });

      // Update client statuses
      setClients(prev => {
        return prev.map(client => {
          // 30% chance to change status
          if (Math.random() < 0.3) {
            const statuses: ClientStatus[] = ['idle', 'training', 'updated', 'error', 'timeout'];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            return {
              ...client,
              status: newStatus,
              lastUpdate: new Date(),
              progress: newStatus === 'training' ? Math.random() * 100 : client.progress,
              accuracy: 70 + Math.random() * 25,
              loss: 0.1 + Math.random() * 0.3
            };
          }
          return client;
        });
      });

      // Add new history data point
      setHistoryData(prev => {
        const activeClientCount = clients.filter(c => 
          c.status === 'training' || c.status === 'updated'
        ).length;
        
        const lastPoint = prev[prev.length - 1];
        const newPoint: HistoryDataPoint = {
          timestamp: Date.now(),
          activeClients: activeClientCount,
          accuracy: Math.min(lastPoint.accuracy + (Math.random() * 2 - 0.5), 99),
          loss: Math.max(lastPoint.loss - (Math.random() * 0.02), 0.01)
        };
        
        // Keep only the last 20 points
        const newHistory = [...prev, newPoint];
        if (newHistory.length > 20) {
          return newHistory.slice(newHistory.length - 20);
        }
        return newHistory;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">نظام التعلم الموزع - واجهة المحاكاة</h1>
        <div className="flex space-x-4 bg-slate-800 p-2 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${activeView === 'network' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            onClick={() => setActiveView('network')}
          >
            مخطط الشبكة
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            onClick={() => setActiveView('dashboard')}
          >
            لوحة التحكم
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${activeView === 'metrics' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            onClick={() => setActiveView('metrics')}
          >
            المقاييس والإحصائيات
          </button>
        </div>
      </header>

      <main>
        <AnimatedView isActive={activeView === 'network'}>
          <NetworkGraph clients={clients} serverStatus={serverStatus} />
        </AnimatedView>
        
        <AnimatedView isActive={activeView === 'dashboard'}>
          <Dashboard clients={clients} serverStatus={serverStatus} />
        </AnimatedView>
        
        <AnimatedView isActive={activeView === 'metrics'}>
          <Metrics clients={clients} historyData={historyData} />
        </AnimatedView>
      </main>

      <footer className="mt-8 text-center text-slate-400">
        <p>تم إنشاء واجهة المحاكاة لمشروع التعلم الموزع © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

// Animated view component for smooth transitions
interface AnimatedViewProps {
  children: React.ReactNode;
  isActive: boolean;
}

const AnimatedView: React.FC<AnimatedViewProps> = ({ children, isActive }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0,
        y: isActive ? 0 : 20,
        display: isActive ? 'block' : 'none'
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default App;
