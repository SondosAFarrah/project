
import tensorflow as tf
import numpy as np
import requests 
import pandas as pd
from app.model.model_definition import create_keras_model  
from app.routes.preprocessing import preprocess_data  
from sklearn.metrics import precision_score, recall_score, accuracy_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split

server_ip = 'host.docker.internal'
server_port = 5000

def receive_model_from_server():
    url = 'http://host.docker.internal:5000/send_model'
    print(f"🔗 Requesting model from server: {url}")
    response = requests.get(url)
    print("📡 Response status:", response.status_code)
    print("📄 Response content:", response.text) 
    weights = response.json() 

    print("📏 Weight shapes received from server:")
    for i, w in enumerate(weights):
        print(f"Weight {i} shape: {np.array(w).shape}")
    
    model = create_keras_model()  
    
    print("📏 Model's weight shapes:")
    for i, layer in enumerate(model.layers):
        print(f"Layer {i} weight shape: {layer.get_weights()[0].shape}")

    model.set_weights([np.array(w) for w in weights])

    return model

def local_training(model, X_train, y_train):
    print("🎯 Starting local training...")
    with tf.GradientTape() as tape:
        predictions = model(X_train, training=True)
        loss = tf.keras.losses.binary_crossentropy(tf.reshape(y_train, (-1, 1)), predictions)
        loss = tf.reduce_mean(loss)

    gradients = tape.gradient(loss, model.trainable_variables)
    optimizer = tf.keras.optimizers.Adam()
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))
    print("📤 Gradients calculated.")
    return gradients, model

def send_gradients_to_server(gradients):
    url = f'http://{server_ip}:{server_port}/submit_update'
    response = requests.post(url, json={'gradients': [g.numpy().tolist() for g in gradients]})
    print("🚀 Sent gradients to server.")
    print(response.json())
  
def evaluate_model(model, X_val, y_val):
    """
    Evaluate the model on validation data
    """
    print("📊 Evaluating model performance...")
    
    # Get model predictions
    predictions = model(X_val, training=False)
    predictions = predictions.numpy().flatten()
    
    # Convert probabilities to binary predictions
    y_pred = (predictions > 0.5).astype(int)
    
    # Calculate metrics
    accuracy = accuracy_score(y_val, y_pred)
    precision = precision_score(y_val, y_pred, average='binary', zero_division=0)
    recall = recall_score(y_val, y_pred, average='binary', zero_division=0)
    f1 = f1_score(y_val, y_pred, average='binary')
    
    # Confusion matrix
    tn, fp, fn, tp = confusion_matrix(y_val, y_pred).ravel()
    
    # Print evaluation metrics
    print("\n📈 Model Evaluation Results:")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print("\nConfusion Matrix:")
    print(f"True Negatives: {tn}, False Positives: {fp}")
    print(f"False Negatives: {fn}, True Positives: {tp}")
    
    # Return metrics for potential logging or reporting
    evaluation_results = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
        'confusion_matrix': {
            'tn': int(tn),
            'fp': int(fp),
            'fn': int(fn),
            'tp': int(tp)
        }
    }
    
    return evaluation_results

def load_and_process_data(file_path, test_size=0.2, random_state=42):
    """
    Load and split data into training and validation sets
    """
    df = pd.read_csv(file_path)  
    X, y = preprocess_data(df)
    
    # Split data into training and validation sets
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    
    split_info = f"📝 Data split - Training: {X_train.shape[0]} samples, Validation: {X_val.shape[0]} samples"
    print(split_info)    
    # Write data split information to txt file
    with open('data_split_info.txt', 'w') as f:
        f.write(split_info)
    print("✏️ Data split information written to data_split_info.txt")


    return X_train, X_val, y_train, y_val

X_train, X_val, y_train, y_val = load_and_process_data('network_traffic.csv')
model = receive_model_from_server()
gradients, updated_model = local_training(model, X_train, y_train)
send_gradients_to_server(gradients)

# Evaluate model
evaluation_results = evaluate_model(updated_model, X_val, y_val)
    
print("✅ Local training and evaluation complete.")
