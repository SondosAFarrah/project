
        // Simulation data and counters
        let currentRound = 15;
        let totalPackets = 2139;
        let attacksDetected = 47;
        let dosCount = 23;
        let arpCount = 12;
        let scanCount = 8;
        let smurfCount = 4;
        let nextRequestTime = 25;
        let client1Packets = 1247;
        let client2Packets = 892;

        // Real-time activity simulation
        const activities = [
            { type: 'traffic', icon: '🌐', messages: [
                'Client 1: Captured {packets} packets, {attacks} attacks detected',
                'Client 2: Network scan completed, {normal} normal packets',
                'Client 1: TCP flood detected from 192.168.100.{ip}',
                'Client 2: ICMP traffic analysis complete'
            ]},
            { type: 'training', icon: '🎯', messages: [
                'Client {client}: Local training started (batch size: 128)',
                'Client {client}: Model convergence at {percent}%',
                'Client {client}: Training completed in {time}s',
                'Client {client}: Gradient computation finished'
            ]},
            { type: 'gradient', icon: '📤', messages: [
                'Client {client}: Gradients sent to server',
                'Server: Aggregating gradients from {count} clients',
                'Server: Gradient aggregation complete',
                'Client {client}: Received updated model weights'
            ]},
            { type: 'server', icon: '🖱️', messages: [
                'Server: Model weights updated, Round {round} complete',
                'Server: Broadcasting updated model to all clients',
                'Server: Training round {round} initiated',
                'Server: Model evaluation complete - Accuracy: {acc}%'
            ]},
            { type: 'attack', icon: '🚨', messages: [
                'Client {client}: DoS attack detected from 192.168.100.{ip}',
                'Client {client}: ARP spoofing attempt blocked',
                'Client {client}: Port scan detected (Nmap signature)',
                'Client {client}: Smurf attack prevented'
            ]}
        ];

        function getTimestamp() {
            const now = new Date();
            return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        }

        function addLogEntry() {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            const message = activity.messages[Math.floor(Math.random() * activity.messages.length)];
            
            // Replace placeholders with random values
            const processedMessage = message
                .replace('{packets}', Math.floor(Math.random() * 200) + 50)
                .replace('{attacks}', Math.floor(Math.random() * 5) + 1)
                .replace('{normal}', Math.floor(Math.random() * 300) + 100)
                .replace('{ip}', Math.floor(Math.random() * 20) + 10)
                .replace('{client}', Math.floor(Math.random() * 2) + 1)
                .replace('{percent}', Math.floor(Math.random() * 20) + 80)
                .replace('{time}', (Math.random() * 10 + 5).toFixed(1))
                .replace('{count}', Math.floor(Math.random() * 3) + 1)
                .replace('{round}', currentRound)
                .replace('{acc}', (Math.random() * 5 + 92).toFixed(1));

            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${activity.type}`;
            logEntry.innerHTML = `<span class="timestamp">${getTimestamp()}</span> ${activity.icon} ${processedMessage}`;
            
            const activityLog = document.getElementById('activityLog');
            activityLog.insertBefore(logEntry, activityLog.firstChild);
            
            // Keep only last 20 entries
            while (activityLog.children.length > 20) {
                activityLog.removeChild(activityLog.lastChild);
            }
        }

        function updateMetrics() {
            // Update client packets
            if (Math.random() > 0.7) {
                client1Packets += Math.floor(Math.random() * 50) + 10;
                document.getElementById('client1-packets').textContent = client1Packets.toLocaleString();
                document.getElementById('client1-last').textContent = 'Last: just now';
            }
            
            if (Math.random() > 0.6) {
                client2Packets += Math.floor(Math.random() * 40) + 8;
                document.getElementById('client2-packets').textContent = client2Packets.toLocaleString();
            }

            // Update total packets
            totalPackets = client1Packets + client2Packets;
            document.getElementById('totalPackets').textContent = totalPackets.toLocaleString();

            // Update attacks
            if (Math.random() > 0.8) {
                attacksDetected += Math.floor(Math.random() * 3) + 1;
                document.getElementById('attacksDetected').textContent = attacksDetected;
                
                // Randomly increase attack type counts
                if (Math.random() > 0.5) dosCount++;
                if (Math.random() > 0.7) arpCount++;
                if (Math.random() > 0.8) scanCount++;
                if (Math.random() > 0.9) smurfCount++;
                
                document.getElementById('dosCount').textContent = dosCount;
                document.getElementById('arpCount').textContent = arpCount;
                document.getElementById('scanCount').textContent = scanCount;
                document.getElementById('smurfCount').textContent = smurfCount;
            }

            // Update detection rate
            const detectionRate = ((attacksDetected / totalPackets) * 100).toFixed(1);
            document.getElementById('detectionRate').textContent = detectionRate + '%';

            // Update performance metrics with slight variations
            const accuracy = (94.7 + (Math.random() - 0.5) * 2).toFixed(1);
            const precision = (96.2 + (Math.random() - 0.5) * 1.5).toFixed(1);
            const recall = (93.1 + (Math.random() - 0.5) * 1.8).toFixed(1);
            const f1Score = (94.6 + (Math.random() - 0.5) * 1.2).toFixed(1);
            
            document.getElementById('accuracy').textContent = accuracy + '%';
            document.getElementById('precision').textContent = precision + '%';
            document.getElementById('recall').textContent = recall + '%';
            document.getElementById('f1Score').textContent = f1Score + '%';

            // Update next request countdown
            nextRequestTime--;
            if (nextRequestTime <= 0) {
                nextRequestTime = 30;
                currentRound++;
                document.getElementById('serverRounds').textContent = `Round ${currentRound}`;
            }
            document.getElementById('nextRequest').textContent = nextRequestTime + 's';

            // Update training progress
            const progress = ((30 - nextRequestTime) / 30) * 100;
            document.getElementById('trainingProgress').style.width = progress + '%';

            // Update client status
            const client1 = document.getElementById('client1');
            const client2 = document.getElementById('client2');
            
            if (Math.random() > 0.8) {
                client1.className = Math.random() > 0.5 ? 'client-card client-active' : 'client-card client-training';
                client2.className = Math.random() > 0.5 ? 'client-card client-active' : 'client-card client-training';
            }
        }

        function updateTimestamps() {
            const now = new Date();
            const timeAgo = Math.floor(Math.random() * 5) + 1;
            document.getElementById('lastUpdateTime').textContent = `${timeAgo} min ago`;
        }

        // Button functions
        function triggerTraining() {
            addLogEntry();
            document.getElementById('trainingStatus').innerHTML = '<div class="status-indicator status-warning"></div><span>Training Triggered</span>';
            setTimeout(() => {
                document.getElementById('trainingStatus').innerHTML = '<div class="status-indicator status-active"></div><span>Training Complete</span>';
            }, 3000);
        }

        function aggregateGradients() {
            addLogEntry();
            currentRound++;
            document.getElementById('serverRounds').textContent = `Round ${currentRound}`;
            nextRequestTime = 30;
        }

        // Initialize intervals
        setInterval(addLogEntry, 3000);
        setInterval(updateMetrics, 2000);
        setInterval(updateTimestamps, 30000);

        // Initial update
        updateMetrics();
