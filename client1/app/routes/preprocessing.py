import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

def preprocess_data(data):
    data.columns = data.columns.str.strip()
    df_cleaned = data.drop(['No.', 'Time', 'Type of attack'], axis=1)

    categorical_columns = df_cleaned.select_dtypes(include=['object']).columns
    for col in categorical_columns:
        le = LabelEncoder()
        df_cleaned[col] = le.fit_transform(df_cleaned[col])

    X_new = df_cleaned.drop(['Type'], axis=1)
    y_new = df_cleaned['Type']

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_new)

    return X_scaled, y_new
