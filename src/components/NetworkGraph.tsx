import React, { useState, useEffect, useRef, useCallback } from 'react';

// Interfaces remain the same as they define the data structure
interface Client {
  id: number;
  status: 'idle' | 'training' | 'sending' | 'receiving' | 'monitoring';
  lastUpdate: Date;
  name: string;
  dataSize: string;
  localAccuracy: number;
  trainingRounds: number;
  networkLatency: string;
  batteryLevel: string;
  cpuUsage: string;
}

interface Server {
  status: 'idle' | 'averaging';
  connectedClients: number;
  lastUpdate: Date;
  totalRounds: number;
  modelAccuracy: number;
  averagingTime: string;
  dataProcessed: string;
}

const NetworkGraph: React.FC = () => {
  // Initial state setup - matching test.html's initial data structure more closely
  const initialNodeInfo = {
    server: {
      name: 'Central Server',
      connectedClients: 4,
      lastUpdate: new Date(),
      totalRounds: 0,
      status: 'idle',
      modelAccuracy: 0.85,
      averagingTime: '2.3s',
      dataProcessed: '0 MB'
    },
    client1: {
      id: 1,
      name: 'Client 1 - Hospital A',
      lastGradientSent: null as Date | null,
      lastUpdate: new Date(),
      status: 'idle',
      dataSize: '2.4 GB',
      localAccuracy: 0.82,
      trainingRounds: 0,
      networkLatency: '45ms',
      batteryLevel: '89%',
      cpuUsage: '23%'
    },
    client2: {
      id: 2,
      name: 'Client 2 - Clinic B',
      lastGradientSent: null as Date | null,
      lastUpdate: new Date(),
      status: 'idle',
      dataSize: '1.8 GB',
      localAccuracy: 0.78,
      trainingRounds: 0,
      networkLatency: '67ms',
      batteryLevel: '76%',
      cpuUsage: '31%'
    },
    client3: {
      id: 3,
      name: 'Client 3 - Research Lab',
      lastGradientSent: null as Date | null,
      lastUpdate: new Date(),
      status: 'idle',
      dataSize: '3.1 GB',
      localAccuracy: 0.88,
      trainingRounds: 0,
      networkLatency: '28ms',
      batteryLevel: '94%',
      cpuUsage: '18%'
    },
    client4: {
      id: 4,
      name: 'Client 4 - Mobile Unit',
      lastGradientSent: null as Date | null,
      lastUpdate: new Date(),
      status: 'idle',
      dataSize: '900 MB',
      localAccuracy: 0.75,
      trainingRounds: 0,
      networkLatency: '123ms',
      batteryLevel: '45%',
      cpuUsage: '67%'
    }
  };

  const [nodeInfo, setNodeInfo] = useState(initialNodeInfo);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [roundStatus, setRoundStatus] = useState('Ready');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [lineCoords, setLineCoords] = useState<{ [key: string]: { x1: number; y1: number; x2: number; y2: number } }>({});

  // Refs for elements to calculate line positions
  const canvasRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);
  const clientRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const statusLabels = {
    training: 'Training Model',
    sending: 'Sending Gradients',
    receiving: 'Receiving Updates',
    monitoring: 'Monitoring Data',
    averaging: 'Aggregating Models', // Updated label to match test.html intent
    idle: 'Ready'
  };

  const getStatusLabel = (status: string) => statusLabels[status as keyof typeof statusLabels] || status;
  
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusIconClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Training Model': 'status-training',
      'Sending Gradients': 'status-sending',
      'Receiving Updates': 'status-receiving',
      'Monitoring Data': 'status-monitoring',
      'Ready': 'status-online',
      'Aggregating Models': 'status-training', // Using training color for aggregation
      'Offline': 'status-offline'
    };
    return statusMap[status] || 'status-offline';
  };

  const showNodeInfo = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowInfoPanel(true);
  };

  const hideNodeInfo = () => {
    setShowInfoPanel(false);
    setSelectedNodeId(null);
  };

  // Function to calculate center of an element relative to the canvas
  const getCenter = useCallback((el: HTMLElement | null) => {
    if (!el || !canvasRef.current) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - canvasRect.left,
      y: rect.top + rect.height / 2 - canvasRect.top
    };
  }, []);

  // Update line coordinates when elements are positioned
  const updateAllLines = useCallback(() => {
    if (!serverRef.current) return;
    const s = getCenter(serverRef.current);
    const newCoords: { [key: string]: { x1: number; y1: number; x2: number; y2: number } } = {};
    Object.keys(clientRefs.current).forEach(clientId => {
      const clientEl = clientRefs.current[clientId];
      if (clientEl) {
        const c = getCenter(clientEl);
        newCoords[clientId] = { x1: c.x, y1: c.y, x2: s.x, y2: s.y };
      }
    });
    setLineCoords(newCoords);
  }, [getCenter]);

  // Update lines on mount and window resize
  useEffect(() => {
    updateAllLines();
    window.addEventListener('resize', updateAllLines);
    return () => window.removeEventListener('resize', updateAllLines);
  }, [updateAllLines]);

  // Use MutationObserver to detect when elements are ready/positioned
  useEffect(() => {
    const observer = new MutationObserver(updateAllLines);
    if (canvasRef.current) {
      observer.observe(canvasRef.current, { childList: true, subtree: true });
    }
    // Initial update after a short delay to allow rendering
    const timeoutId = setTimeout(updateAllLines, 100);
    return () => {
       observer.disconnect();
       clearTimeout(timeoutId);
    }
  }, [updateAllLines]);


  // --- Simulation Logic (Adapted from test.html) ---

  const updateNodeState = useCallback((id: string, status: string, updates?: Partial<Client | Server>) => {
    setNodeInfo(prev => {
      const newState = { ...prev };
      if (id === 'server') {
        newState.server = { ...newState.server, status: status as Server['status'], lastUpdate: new Date(), ...updates };
      } else {
        const clientId = id as keyof typeof initialNodeInfo;
        if (newState[clientId]) {
          newState[clientId] = { ...newState[clientId], status: status as Client['status'], lastUpdate: new Date(), ...updates };
          if (status === 'sending') {
            (newState[clientId] as Client).lastGradientSent = new Date();
            (newState[clientId] as Client).trainingRounds++;
            // Simulate resource usage changes
            (newState[clientId] as Client).batteryLevel = `${Math.max(5, parseInt((newState[clientId] as Client).batteryLevel) - 2)}%`;
            (newState[clientId] as Client).cpuUsage = `${Math.min(95, parseInt((newState[clientId] as Client).cpuUsage) + 5)}%`;
          } else if (status === 'idle') {
             // Simulate resource recovery
            (newState[clientId] as Client).cpuUsage = `${Math.max(10, parseInt((newState[clientId] as Client).cpuUsage) - 10)}%`;
          }
        }
      }
      return newState;
    });
  }, []);

  const runClientCycle = useCallback(async (clientId: string, delay: number) => {
    await new Promise(resolve => setTimeout(resolve, delay));

    const states: Client['status'][] = ['training', 'sending', 'receiving', 'monitoring'];
    const durations = [3000, 1500, 1500, 2000]; // Adjusted timings slightly

    for (let i = 0; i < states.length; i++) {
      if (!isRunningRef.current) break;
      updateNodeState(clientId, states[i]);
      await new Promise(resolve => setTimeout(resolve, durations[i]));
    }

    if (isRunningRef.current) {
      updateNodeState(clientId, 'idle');
    }
  }, [updateNodeState]);

  // Ref to track running state within async loops
  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  const startRound = useCallback(async () => {
    if (isRunningRef.current) return;

    setIsRunning(true);
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setRoundStatus('Training in Progress');
    setProgress(0);

    // Progress simulation
    let currentProgress = 0;
    const totalDuration = 10000; // Approx total round time
    const intervalTime = 200;
    const progressIncrement = (intervalTime / totalDuration) * 100;

    const progressInterval = setInterval(() => {
      currentProgress += progressIncrement;
      if (currentProgress >= 100 || !isRunningRef.current) {
        clearInterval(progressInterval);
        setProgress(100);
      } else {
        setProgress(currentProgress);
      }
    }, intervalTime);

    // Start all clients with slight delays
    const clientIds = ['client1', 'client2', 'client3', 'client4'];
    const clientPromises = clientIds.map((id, i) =>
      runClientCycle(id, i * 300)
    );

    // Wait for training/sending phases (approx)
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (isRunningRef.current) {
      updateNodeState('server', 'averaging', { totalRounds: nextRound });
      setRoundStatus('Server Aggregating Models');
      // Simulate accuracy increase and data processed
      setNodeInfo(prev => ({
        ...prev,
        server: {
          ...prev.server,
          modelAccuracy: Math.min(0.98, prev.server.modelAccuracy + 0.015),
          dataProcessed: `${(parseFloat(prev.server.dataProcessed) + 500 + Math.random() * 200).toFixed(1)} MB`
        }
      }));
    }

    // Wait for all clients to finish their cycles
    await Promise.all(clientPromises);

    // Wait for server averaging animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (isRunningRef.current) {
      updateNodeState('server', 'idle');
      setRoundStatus('Round Complete');

      // Short pause before next round
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isRunningRef.current) {
        setProgress(0);
        setRoundStatus('Ready');
        setIsRunning(false);
        // Auto-start next round
        startRound();
      }
    }

    // Cleanup interval if component unmounts or stops
    return () => clearInterval(progressInterval);

  }, [currentRound, runClientCycle, updateNodeState]);

  // Start simulation on mount
  useEffect(() => {
    const timeoutId = setTimeout(startRound, 1000); // Delay start slightly
    return () => {
      clearTimeout(timeoutId);
      setIsRunning(false); // Ensure cleanup stops loops
      isRunningRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Rendering --- 

  const selectedNodeData = selectedNodeId ? nodeInfo[selectedNodeId as keyof typeof nodeInfo] : null;

  return (
    <>
      {/* Inject CSS directly matching test.html */}
      <style>{`
        /* Basic Setup */
        body {
          background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center;
          overflow: hidden;
          margin: 0;
          padding: 0;
          height: 100vh;
          width: 100vw;
        }
        #root {
            height: 100%;
            width: 100%;
        }
        .network-graph-container {
            height: 100%;
            width: 100%;
            position: relative;
        }

        h1 {
          margin: 20px 0;
          font-size: 2.5rem;
          background: linear-gradient(45deg, #00ffcc, #0066ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
        }

        /* Canvas */
        #canvas {
          position: relative;
          width: 100%; /* Changed from 100vw */
          height: 80vh;
          margin: 0 auto; /* Center canvas if needed */
        }

        /* SVG and Lines */
        svg {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          pointer-events: none; /* Allow clicks to pass through */
        }

        line {
          stroke: rgba(255, 255, 255, 0.2);
          stroke-width: 2;
          opacity: 0.6; /* Slightly visible by default */
          transition: all 0.5s ease;
        }

        line.active {
          stroke: #00ffcc;
          stroke-width: 4;
          opacity: 1;
          filter: drop-shadow(0 0 8px #00ffcc);
          animation: dash 1.5s linear infinite;
        }

        line.gradient-active {
          stroke: url(#gradient);
          stroke-width: 5;
          opacity: 1;
          filter: drop-shadow(0 0 10px #00ffcc);
          animation: gradient-flow 2s linear infinite;
        }

        @keyframes dash {
          0% { stroke-dasharray: 8, 8; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 8, 8; stroke-dashoffset: -16; }
        }

        @keyframes gradient-flow {
          0% { stroke-dasharray: 10, 10; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 10, 10; stroke-dashoffset: -20; }
        }

        /* Nodes */
        .node {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          position: absolute;
          display: flex; /* Use flex for centering icon/text */
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 1rem; /* Adjusted for content */
          color: white;
          border: 4px solid #00ffcc;
          z-index: 2;
          transition: all 0.4s ease-in-out;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          cursor: pointer;
        }

        .node:hover {
          transform: scale(1.05); /* Base hover effect */
          box-shadow: 0 0 25px rgba(0, 255, 204, 0.6);
        }

        .server {
          background: linear-gradient(145deg, #2e8b57, #3cb371);
          top: 40%; /* Center vertically */
          left: 50%;
          transform: translateX(-50%); /* Center horizontally */
          border-color: #00ff7f;
          box-shadow: 0 0 30px rgba(0, 255, 127, 0.4);
        }
        .server:hover {
           transform: translateX(-50%) scale(1.05); /* Keep centering on hover */
        }

        .client {
          background: linear-gradient(145deg, #444, #666);
          border-color: #64748b; /* Default client border */
        }

        /* Specific Client Positions */
        .client1 { top: 15%; left: 15%; }
        .client2 { top: 15%; left: 85%; transform: translateX(-100%); } /* Use left/transform for right align */
        .client3 { top: 85%; left: 15%; transform: translateY(-100%);} /* Use top/transform for bottom align */
        .client4 { top: 85%; left: 85%; transform: translate(-100%, -100%); } /* Use top/left/transform */

        /* Status Animations & Styles */
        .node.training {
          background: linear-gradient(145deg, #0057b7, #4169e1) !important;
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 25px rgba(65, 105, 225, 0.6);
          border-color: #4169e1;
        }

        .node.sending {
          background: linear-gradient(145deg, #ffd700, #ffed4e) !important;
          animation: send 1.2s infinite;
          box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
          border-color: #ffd700;
        }

        .node.receiving {
          background: linear-gradient(145deg, #4caf50, #66bb6a) !important;
          animation: receive 1.2s infinite;
          box-shadow: 0 0 25px rgba(76, 175, 80, 0.6);
          border-color: #4caf50;
        }

        .node.monitoring {
          background: linear-gradient(145deg, #e60026, #ff1744) !important;
          box-shadow: 0 0 30px rgba(230, 0, 38, 0.8);
          animation: monitor 2s infinite;
          border-color: #e60026;
        }

        .node.averaging {
          background: linear-gradient(145deg, #9c27b0, #ba68c8) !important;
          animation: averaging 2s infinite;
          box-shadow: 0 0 40px rgba(156, 39, 176, 0.8);
          border-color: #9c27b0;
        }

        /* Keyframes (Copied from test.html) */
        @keyframes pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
        /* Server needs specific pulse adjustment due to initial transform */
        .server.training {
            animation: pulse-server 1.5s infinite;
        }
        @keyframes pulse-server {
          0%, 100% { transform: translateX(-50%) scale(1) rotate(0deg); }
          50% { transform: translateX(-50%) scale(1.1) rotate(2deg); }
        }

        @keyframes send {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
        /* Adjust send for positioned clients */
        .client1.sending, .client2.sending { animation: send-top 1.2s infinite; }
        .client3.sending, .client4.sending { animation: send-bottom 1.2s infinite; }
        @keyframes send-top {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(0, -8px) scale(1.05); }
        }
        @keyframes send-bottom {
           0%, 100% { transform: translate(-100%, -100%) scale(1); }
           50% { transform: translate(-100%, calc(-100% - 8px)) scale(1.05); }
        }
         .client2.sending { animation: send-top-right 1.2s infinite; }
         @keyframes send-top-right {
            0%, 100% { transform: translateX(-100%) scale(1); }
            50% { transform: translate(calc(-100%), -8px) scale(1.05); }
         }
         .client4.sending { animation: send-bottom-right 1.2s infinite; }
         @keyframes send-bottom-right {
            0%, 100% { transform: translate(-100%, -100%) scale(1); }
            50% { transform: translate(-100%, calc(-100% - 8px)) scale(1.05); }
         }


        @keyframes receive {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(8px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
        /* Adjust receive for positioned clients */
        .client1.receiving, .client2.receiving { animation: receive-top 1.2s infinite; }
        .client3.receiving, .client4.receiving { animation: receive-bottom 1.2s infinite; }
         @keyframes receive-top {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(0, 8px) scale(1.05); }
        }
        @keyframes receive-bottom {
           0%, 100% { transform: translate(-100%, -100%) scale(1); }
           50% { transform: translate(-100%, calc(-100% + 8px)) scale(1.05); }
        }
         .client2.receiving { animation: receive-top-right 1.2s infinite; }
         @keyframes receive-top-right {
            0%, 100% { transform: translateX(-100%) scale(1); }
            50% { transform: translate(calc(-100%), 8px) scale(1.05); }
         }
         .client4.receiving { animation: receive-bottom-right 1.2s infinite; }
         @keyframes receive-bottom-right {
            0%, 100% { transform: translate(-100%, -100%) scale(1); }
            50% { transform: translate(-100%, calc(-100% + 8px)) scale(1.05); }
         }

        @keyframes monitor {
          0%, 100% { 
            box-shadow: 0 0 20px 3px rgba(230, 0, 38, 0.6);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 40px 8px rgba(255, 28, 68, 0.9);
            transform: scale(1.08);
          }
        }
        /* Adjust monitor for positioned clients */
        .client1.monitoring, .client2.monitoring { animation: monitor-top 2s infinite; }
        .client3.monitoring, .client4.monitoring { animation: monitor-bottom 2s infinite; }
        @keyframes monitor-top {
           0%, 100% { box-shadow: 0 0 20px 3px rgba(230, 0, 38, 0.6); transform: translate(0, 0) scale(1); }
           50% { box-shadow: 0 0 40px 8px rgba(255, 28, 68, 0.9); transform: translate(0, 0) scale(1.08); }
        }
        @keyframes monitor-bottom {
           0%, 100% { box-shadow: 0 0 20px 3px rgba(230, 0, 38, 0.6); transform: translate(-100%, -100%) scale(1); }
           50% { box-shadow: 0 0 40px 8px rgba(255, 28, 68, 0.9); transform: translate(-100%, -100%) scale(1.08); }
        }
        .client2.monitoring { animation: monitor-top-right 2s infinite; }
        @keyframes monitor-top-right {
           0%, 100% { box-shadow: 0 0 20px 3px rgba(230, 0, 38, 0.6); transform: translateX(-100%) scale(1); }
           50% { box-shadow: 0 0 40px 8px rgba(255, 28, 68, 0.9); transform: translateX(-100%) scale(1.08); }
        }
        .client4.monitoring { animation: monitor-bottom-right 2s infinite; }
        @keyframes monitor-bottom-right {
           0%, 100% { box-shadow: 0 0 20px 3px rgba(230, 0, 38, 0.6); transform: translate(-100%, -100%) scale(1); }
           50% { box-shadow: 0 0 40px 8px rgba(255, 28, 68, 0.9); transform: translate(-100%, -100%) scale(1.08); }
        }


        @keyframes averaging {
          0%, 100% { 
            transform: translateX(-50%) rotate(0deg) scale(1);
            box-shadow: 0 0 30px rgba(156, 39, 176, 0.6);
          }
          50% { 
            transform: translateX(-50%) rotate(10deg) scale(1.1);
            box-shadow: 0 0 50px rgba(186, 104, 200, 0.9);
          }
        }

        /* Icons */
        .node i {
          font-size: 40px; /* Icon size */
          margin-bottom: 5px; /* Space between icon and text */
        }

        /* Labels */
        .label {
          position: absolute;
          width: 220px;
          text-align: center;
          color: #e0e0e0;
          font-size: 14px;
          font-weight: 600;
          z-index: 3;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 15px;
          padding: 5px 10px;
          backdrop-filter: blur(5px);
          pointer-events: none; /* Labels shouldn't block clicks */
        }

        /* Status Label (below node) */
        .status-label {
          position: absolute;
          width: 150px;
          text-align: center;
          color: #fff;
          font-size: 12px;
          font-weight: bold;
          z-index: 4;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 10px;
          padding: 3px 8px;
          /* Position below the node */
          top: 100%; 
          left: 50%;
          transform: translate(-50%, 10px); /* Center below with margin */
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .node:hover .status-label,
        .node:not(.idle) .status-label {
            opacity: 1; /* Show on hover or when not idle */
        }

        /* Monitoring Waves (Copied from test.html) */
        .monitoring-waves {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(230, 0, 38, 0.6);
          opacity: 0;
          animation: wave-expand 3s infinite;
          pointer-events: none;
          z-index: 1;
          /* Centered on the node */
          width: 120px; 
          height: 120px;
          top: 0;
          left: 0;
        }

        @keyframes wave-expand {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5); /* Expand to 2.5 times size */
            opacity: 0;
          }
        }

        /* Progress Bar & Round Info */
        .progress-bar {
          position: fixed; /* Use fixed to keep at top */
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          z-index: 10;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffcc, #0066ff, #9c27b0);
          width: 0%;
          transition: width 0.5s ease;
          border-radius: 4px;
        }

        .round-info {
          position: fixed; /* Use fixed */
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          color: #00ffcc;
          font-size: 18px;
          font-weight: bold;
          z-index: 10;
        }

        /* Info Panel */
        .info-panel {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%) translateX(110%); /* Start off-screen */
          width: 350px;
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #00ffcc;
          border-radius: 20px;
          padding: 20px;
          color: white;
          backdrop-filter: blur(15px);
          box-shadow: 0 0 30px rgba(0, 255, 204, 0.3);
          opacity: 0;
          visibility: hidden;
          transition: all 0.4s ease;
          z-index: 20;
          max-height: 80vh;
          overflow-y: auto;
        }

        .info-panel.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(-50%) translateX(0); /* Slide in */
        }

        .info-panel h3 {
          margin: 0 0 15px 0;
          color: #00ffcc;
          font-size: 20px;
          text-align: center;
          border-bottom: 2px solid #00ffcc;
          padding-bottom: 10px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .info-item:last-child {
            border-bottom: none;
        }

        .info-label {
          color: #ccc;
          font-weight: 600;
          margin-right: 10px;
        }

        .info-value {
          color: #00ffcc;
          font-weight: bold;
          text-align: right;
        }

        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
        }

        /* Status Indicator Colors */
        .status-online { background: #4caf50; }
        .status-training { background: #2196f3; }
        .status-sending { background: #ffd700; }
        .status-receiving { background: #4caf50; }
        .status-monitoring { background: #f44336; }
        .status-offline { background: #999; }
        .status-averaging { background: #9c27b0; } /* Added for server */

        .close-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          color: #ff4444;
          font-size: 24px; /* Slightly larger */
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          line-height: 30px; /* Center 'x' */
          text-align: center;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 68, 68, 0.2);
          transform: rotate(90deg);
        }

        /* Performance Chart (Simple Placeholder) */
        .performance-chart {
          margin: 15px 0;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 5px;
        }

        .chart-bar {
          flex-grow: 1; /* Distribute space */
          width: 4px;
          background: linear-gradient(to top, #00ffcc, #0066ff);
          border-radius: 2px 2px 0 0;
          margin: 0 1px;
          transition: height 0.3s ease;
        }

      `}</style>

      {/* Font Awesome Link */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

      <div className="network-graph-container">
        <h1>محاكاة التعلم الفيدرالي المتقدمة</h1>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="round-info">Round: {currentRound} | Status: {roundStatus}</div>

        <div id="canvas" ref={canvasRef}>
          <svg width="100%" height="100%">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#00ffcc', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#0066ff', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#9c27b0', stopOpacity: 1 }} />
              </linearGradient>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                 <path d="M0,0 L0,6 L9,3 z" fill="#00ffcc" />
              </marker>
               <marker id="arrow-gradient" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                 <path d="M0,0 L0,6 L9,3 z" fill="url(#gradient)" />
              </marker>
            </defs>
            {Object.entries(lineCoords).map(([clientId, coords]) => {
              const clientNode = nodeInfo[clientId as keyof typeof nodeInfo] as Client;
              const isActive = clientNode?.status === 'receiving'; // Line active on receiving
              const isGradient = clientNode?.status === 'sending'; // Gradient on sending
              return (
                <line
                  key={`line-${clientId}`}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  className={`${isActive ? 'active' : ''} ${isGradient ? 'gradient-active' : ''}`}
                  markerEnd={isActive ? 'url(#arrow)' : isGradient ? 'url(#arrow-gradient)' : undefined}
                />
              );
            })}
          </svg>

          {/* Server Node */}
          <div
            id="server"
            ref={serverRef}
            className={`node server ${nodeInfo.server.status}`}
            onClick={() => showNodeInfo('server')}
          >
            <i className="fas fa-server"></i>
            <span>Server</span> {/* Simple text inside */} 
            <div className="status-label" id="server-status">{getStatusLabel(nodeInfo.server.status)}</div>
          </div>
          <div className="label" style={{ top: 'calc(40% + 130px)', left: '50%', transform: 'translateX(-50%)' }}>Server (Model Aggregation)</div>

          {/* Client Nodes */}
          {Object.entries(nodeInfo).filter(([key]) => key.startsWith('client')).map(([key, clientData]) => {
            const client = clientData as Client;
            const clientId = `client${client.id}`;
            const positionClass = `client${client.id}`;
            const labelPosition = {
                1: { top: '8%', left: '15%' },
                2: { top: '8%', left: '85%', transform: 'translateX(-100%)' }, // Adjusted for right alignment
                3: { top: 'calc(85% + 130px)', left: '15%' }, // Adjusted for bottom alignment
                4: { top: 'calc(85% + 130px)', left: '85%', transform: 'translateX(-100%)' } // Adjusted for bottom-right
            }[client.id] || {};

            return (
              <React.Fragment key={clientId}>
                <div
                  id={clientId}
                  ref={el => clientRefs.current[clientId] = el}
                  className={`node client ${positionClass} ${client.status}`}
                  onClick={() => showNodeInfo(clientId)}
                >
                  <i className="fas fa-laptop"></i>
                  <span>Client {client.id}</span>
                  <div className="status-label" id={`${clientId}-status`}>{getStatusLabel(client.status)}</div>
                  {/* Monitoring Waves */}
                  {client.status === 'monitoring' && (
                    [0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="monitoring-waves"
                        style={{ animationDelay: `${i * 0.8}s` }}
                      />
                    ))
                  )}
                </div>
                <div className="label" style={labelPosition}>Client {client.id}</div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Info Panel */} 
        <div className={`info-panel ${showInfoPanel ? 'active' : ''}`} id="infoPanel">
          <button className="close-btn" id="closeBtn" onClick={hideNodeInfo}>×</button>
          <h3 id="infoTitle">{selectedNodeData ? (selectedNodeData as any).name || 'Node Information' : 'Node Information'}</h3>
          <div id="infoContent">
            {selectedNodeData && (
              selectedNodeId === 'server' ? (
                <>
                  <div className="info-item"><span className="info-label">Status:</span> <span className="info-value"><span className={`status-indicator ${getStatusIconClass(getStatusLabel(nodeInfo.server.status))}`}></span>{getStatusLabel(nodeInfo.server.status)}</span></div>
                  <div className="info-item"><span className="info-label">Connected Clients:</span> <span className="info-value">{nodeInfo.server.connectedClients}</span></div>
                  <div className="info-item"><span className="info-label">Model Accuracy:</span> <span className="info-value">{(nodeInfo.server.modelAccuracy * 100).toFixed(1)}%</span></div>
                  <div className="info-item"><span className="info-label">Total Rounds:</span> <span className="info-value">{nodeInfo.server.totalRounds}</span></div>
                  <div className="info-item"><span className="info-label">Avg. Aggregation Time:</span> <span className="info-value">{nodeInfo.server.averagingTime}</span></div>
                  <div className="info-item"><span className="info-label">Total Data Processed:</span> <span className="info-value">{nodeInfo.server.dataProcessed}</span></div>
                  <div className="info-item"><span className="info-label">Last Update:</span> <span className="info-value">{formatTimeAgo(nodeInfo.server.lastUpdate)}</span></div>
                </>
              ) : (
                (() => {
                  const client = selectedNodeData as Client;
                  return (
                    <>
                      <div className="info-item"><span className="info-label">Status:</span> <span className="info-value"><span className={`status-indicator ${getStatusIconClass(getStatusLabel(client.status))}`}></span>{getStatusLabel(client.status)}</span></div>
                      <div className="info-item"><span className="info-label">Data Size:</span> <span className="info-value">{client.dataSize}</span></div>
                      <div className="info-item"><span className="info-label">Local Accuracy:</span> <span className="info-value">{(client.localAccuracy * 100).toFixed(1)}%</span></div>
                      <div className="info-item"><span className="info-label">Training Rounds:</span> <span className="info-value">{client.trainingRounds}</span></div>
                      <div className="info-item"><span className="info-label">Network Latency:</span> <span className="info-value">{client.networkLatency}</span></div>
                      <div className="info-item"><span className="info-label">CPU Usage:</span> <span className="info-value">{client.cpuUsage}</span></div>
                      <div className="info-item"><span className="info-label">Battery Level:</span> <span className="info-value">{client.batteryLevel}</span></div>
                      <div className="info-item"><span className="info-label">Last Gradient Sent:</span> <span className="info-value">{formatTimeAgo(client.lastGradientSent)}</span></div>
                      <div className="info-item"><span className="info-label">Last Update:</span> <span className="info-value">{formatTimeAgo(client.lastUpdate)}</span></div>
                      {/* Performance Chart Placeholder */}
                      <div className="info-item">
                        <span className="info-label">Recent Performance:</span>
                      </div>
                      <div className="performance-chart">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="chart-bar" style={{ height: `${Math.random() * 80 + 10}%` }}></div>
                        ))}
                      </div>
                    </>
                  );
                })()
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NetworkGraph;

