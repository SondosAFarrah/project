#stoppppppppp
import multiprocessing
import subprocess
import time
import tensorflow as tf
import numpy as np
from flask import Flask, jsonify, request

def run_client1_periodically():
    while True:
        print("🚨 Running client1.py to capture network traffic...")
        subprocess.run(["python", "client1.py"])
        print("⏳ Sleeping before next capture...")
        time.sleep(30)

def start_flask_server():
    app = Flask(__name__)

    @app.route('/get_update', methods=['GET'])
    def get_update():
        try:
            print("📡 Received /get_update request from server.")
            start_time = time.time()

            result = subprocess.run(
                ["python", "local_train.py"],
                check=True,
                timeout=25,
                capture_output=True,
                text=True
            )
            print(f"✅ Training completed in {time.time()-start_time:.2f}s")
            print(result.stdout)
            return jsonify({"status": "success"}), 200
        except subprocess.TimeoutExpired:
            print("⏰ Local training timed out (25s)")
            return jsonify({"status": "timeout"}), 500
        except subprocess.CalledProcessError as e:
            print("❌ Error during training:")
            print("STDOUT:", e.stdout)
            print("STDERR:", e.stderr)
            return jsonify({
                "status": "error",
                "message": e.stderr
            }), 500

    @app.route('/receive_model', methods=['POST'])
    def receive_model():
        try:
            data = request.get_json()
            weights = [np.array(w) for w in data['weights']]
            
            # تحميل الموديل الموجود عند الكلاينت
            model = tf.keras.models.load_model('model/local_model.h5')
            model.set_weights(weights)
            model.save('model/local_model.h5')

            print("✅ Updated local model received and saved.")
            return jsonify({"status": "success"})
        except Exception as e:
            print(f"❌ Error receiving updated model: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    app.run(host="0.0.0.0", port=6001)

if __name__ == "__main__":
    process1 = multiprocessing.Process(target=run_client1_periodically)
    process2 = multiprocessing.Process(target=start_flask_server)

    process1.start()
    process2.start()

    process1.join()
    process2.join()
