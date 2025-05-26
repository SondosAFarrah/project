from flask import Flask, render_template
import tensorflow as tf
from sklearn.metrics import confusion_matrix, accuracy_score, recall_score, precision_score, f1_score
import os

from preprocessing import preprocess_data  

template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../templates'))
app = Flask(__name__, template_folder=template_dir)

model = tf.keras.models.load_model('app/model/model.h5')

DEFAULT_CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../client1/network_traffic.csv'))

def evaluate_model(file_path):
    try:
        X, y = preprocess_data(file_path)

        predictions = model.predict(X)
        predictions_class = (predictions > 0.5).astype(int).flatten()

        cm = confusion_matrix(y, predictions_class)
        tn, fp, fn, tp = cm.ravel()

        accuracy = accuracy_score(y, predictions_class)
        precision = precision_score(y, predictions_class)
        recall = recall_score(y, predictions_class)
        f1 = f1_score(y, predictions_class)

        return {
            "status": "success",
            "total_predictions": len(predictions_class),
            "predicted_attacks": (predictions_class == 1).sum(),
            "predicted_normal": (predictions_class == 0).sum(),
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "tp": tp
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.route('/')
def show_results():
    result = evaluate_model(DEFAULT_CSV_PATH)

    if result['status'] == 'error':
        return render_template('error.html', error=result['message'])

    return render_template('result.html', result=result)

if __name__ == '__main__':
    print(f"Current directory: {os.getcwd()}")
    print(f"Template directory: {app.template_folder}")
    print(f"Default CSV path: {DEFAULT_CSV_PATH}")
    app.run(debug=True)