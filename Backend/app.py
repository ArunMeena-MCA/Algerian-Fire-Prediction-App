import os
from pyexpat import features
import traceback
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import traceback

# Load env variables (optional)
load_dotenv()

application = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
app = application
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",  # Vite dev
    "https://algerian-fire-prediction-app.vercel.app"  # Vercel prod
]}})

# === Load your scaler and model ===
BASE_DIR = os.path.dirname(__file__)
SCALER_PATH = os.path.join(BASE_DIR, "Model", "scaler.pkl")
MODEL_PATH = os.path.join(BASE_DIR, "Model", "ridge.pkl")

try:
    scaler = joblib.load(SCALER_PATH)
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load model/scaler: {e}")

# Helper: convert JSON -> DataFrame
def to_dataframe(payload):
    if isinstance(payload, dict):
        if "instances" in payload:
            return pd.DataFrame(payload["instances"])
        if "features" in payload:
            return pd.DataFrame([payload["features"]])
        return pd.DataFrame([payload])
    elif isinstance(payload, list):
        return pd.DataFrame(payload)
    else:
        raise ValueError("Unsupported payload type")

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Extract the nested features dict
        features_dict = data.get("features", {})

        # Safely get values, default to 0 if missing
        feature_order = ["Temperature","RH","Ws","Rain","FFMC","DMC","DC","ISI","BUI"]
        features = [float(features_dict.get(f, 0)) for f in feature_order]

        print("Features:", features)

        # Scale & predict
        scaled_features = scaler.transform([features])
        prediction = model.predict(scaled_features)[0]

        return jsonify({"prediction": float(prediction)})

    except Exception as e:
        print("🔥 ERROR in /api/predict:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    
@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

# Serve React build (prod only)
@app.get("/")
def index():
    dist = app.static_folder
    if os.path.exists(os.path.join(dist, "index.html")):
        return send_from_directory(dist, "index.html")
    return jsonify({"message": "API is running. Build the frontend to serve UI."})

@app.errorhandler(404)
def frontend_fallback(_):
    dist = app.static_folder
    index_path = os.path.join(dist, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(dist, "index.html")
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
