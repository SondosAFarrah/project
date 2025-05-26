from flask import Flask, jsonify, request
import tensorflow as tf
import numpy as np
import requests
import threading
import time

app = Flask(__name__)

MODEL_PATH = 'app/model/model.h5'
model = tf.keras.models.load_model(MODEL_PATH)

clients = [
    "http://127.0.0.1:6001/get_update"
]

received_gradients = []

# ======================= background trigger ============================
def trigger_training_on_clients(interval=30):
    """Triggers training on all clients every 30 seconds"""
    print("🟢 Automatic training trigger started (30s interval).")
    while True:
        trigger_training_round()
        time.sleep(interval)

def trigger_training_round():
    """Send GET request to all clients with 10s timeout"""
    success_count = 0
    for url in clients:
        try:
            print(f"📡 Sending training request to: {url}")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"✅ Client responded successfully: {url}")
                success_count += 1
            else:
                print(f"⚠️ Client error {url}: HTTP {response.status_code}")
        except requests.exceptions.Timeout:
            print(f"⌛ Timeout (10s) reached for client {url} - skipping")
        except Exception as e:
            print(f"❌ Failed to reach client {url}: {e}")
    if success_count == 0:
        print("🔴 No clients responded within timeout period.")
    else:
        print(f"🟡 Training triggered on {success_count} clients.")

def start_background_trigger():
    threading.Thread(target=trigger_training_on_clients, daemon=True).start()

# ======================= Flask endpoints ============================

@app.route('/send_model', methods=['GET'])
def send_model():
    weights = model.get_weights()
    serialized = [w.tolist() for w in weights]
    return jsonify(serialized)

@app.route('/submit_update', methods=['POST'])
def submit_update():
    try:
        data = request.json
        gradients = [np.array(g) for g in data['gradients']]
        received_gradients.append(gradients)
        print(f"📥 Received gradients from client. Total: {len(received_gradients)}")
        return jsonify({"status": "success", "message": "Gradients received."})
    except Exception as e:
        print(f"❌ Error in /submit_update: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/aggregate_gradients', methods=['POST'])
def aggregate_gradients():
    global received_gradients

    if not received_gradients:
        print("⏳ No gradients received in this round - waiting for next cycle")
        return jsonify({"status": "skipped", "message": "No gradients received"}), 200

    print(f"📊 Aggregating from {len(received_gradients)} clients.")
    averaged_gradients = [
        np.mean(grads, axis=0) for grads in zip(*received_gradients)
    ]

    optimizer = tf.keras.optimizers.Adam()
    optimizer.apply_gradients(zip(averaged_gradients, model.trainable_variables))

    model.save(MODEL_PATH)
    received_gradients = []

    print("✅ Model updated after aggregation.")

    updated_weights = [w.tolist() for w in model.get_weights()]
    for url in clients:
        client_receive_url = url.replace('/get_update', '/receive_model')
        try:
            print(f"📤 Sending updated model to: {client_receive_url}")
            response = requests.post(
                client_receive_url,
                json={"weights": updated_weights},
                timeout=5
            )
            if response.status_code == 200:
                print(f"✅ Model sent successfully to {client_receive_url}")
            else:
                print(f"⚠️ Failed to send model to {client_receive_url}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ Error sending model to {client_receive_url}: {e}")

    print("🚀 Triggering next training round after aggregation.")
    trigger_training_round()

    return jsonify({"status": "success", "message": "Gradients aggregated, model updated, and next round triggered."})
    

# ======================= Run ============================

if __name__ == '__main__':
    start_background_trigger()
    app.run(host='0.0.0.0', port=5000, use_reloader=False)
