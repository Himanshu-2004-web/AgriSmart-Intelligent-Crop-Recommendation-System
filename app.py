"""
AgriSmart — Full-Stack Machine Learning Crop Recommendation System
Flask Backend Application (app.py)

Endpoints:
    - GET  /              : Serve main web dashboard
    - POST /api/predict   : Validate inputs and return ML crop recommendation
    - GET  /api/metrics   : Serve saved ML model evaluation metrics
    - GET  /api/health    : Health check & model status
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory
import joblib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger("AgriSmart")

# Path configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

MODEL_PATH = os.path.join(MODELS_DIR, "crop_model.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics.json")

# Initialize Flask app
app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)

# Global model and metrics cache
model_pipeline = None
model_metrics = {}
feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

# Crop Agronomic Metadata (for academic viva & dashboard presentation)
CROP_METADATA = {
    "rice": {
        "category": "Cereal / Grain",
        "icon": "🌾",
        "season": "Kharif (Monsoon)",
        "ideal_soil": "Clayey, alluvial loam with high water-retention capacity",
        "water_requirement": "High (Standing water required during vegetative phase)"
    },
    "maize": {
        "category": "Cereal / Coarse Grain",
        "icon": "🌽",
        "season": "Kharif & Rabi",
        "ideal_soil": "Deep, rich, well-drained loamy soils with neutral pH",
        "water_requirement": "Moderate (Sensitive to both drought and waterlogging)"
    },
    "chickpea": {
        "category": "Pulse / Legume",
        "icon": "🌱",
        "season": "Rabi (Winter)",
        "ideal_soil": "Well-drained sandy loam to clay loam; fixes atmospheric nitrogen",
        "water_requirement": "Low to Moderate (Thrives in residual soil moisture)"
    },
    "kidneybeans": {
        "category": "Pulse / Legume",
        "icon": "🫘",
        "season": "Kharif / Spring",
        "ideal_soil": "Light loamy or sandy loam with good organic content",
        "water_requirement": "Moderate (Regular moisture without water stagnation)"
    },
    "pigeonpeas": {
        "category": "Pulse / Legume",
        "icon": "🌿",
        "season": "Kharif",
        "ideal_soil": "Deep loamy soils, tolerant of mild drought and low fertility",
        "water_requirement": "Low to Moderate (Deep taproot drought tolerance)"
    },
    "mothbeans": {
        "category": "Pulse / Arid Legume",
        "icon": "🌾",
        "season": "Kharif",
        "ideal_soil": "Sandy, arid, low-fertility soils; highly drought-hardy",
        "water_requirement": "Very Low (Adapted to arid and semi-arid tracts)"
    },
    "mungbean": {
        "category": "Pulse / Legume",
        "icon": "🌱",
        "season": "Zaid / Kharif",
        "ideal_soil": "Fertile loam with good drainage and neutral pH (6.2-7.2)",
        "water_requirement": "Low to Moderate (Short-duration catch crop)"
    },
    "blackgram": {
        "category": "Pulse / Legume",
        "icon": "🫘",
        "season": "Kharif & Rabi",
        "ideal_soil": "Heavier soils, loams with good water retention and organic carbon",
        "water_requirement": "Moderate"
    },
    "lentil": {
        "category": "Pulse / Legume",
        "icon": "🍲",
        "season": "Rabi",
        "ideal_soil": "Light to medium textured soils, neutral to slightly alkaline",
        "water_requirement": "Low"
    },
    "pomegranate": {
        "category": "Horticultural Fruit",
        "icon": "🍎",
        "season": "Perennial (Mrig, Ambe, or Hasta bahar)",
        "ideal_soil": "Light to medium loam with depth > 60cm and excellent drainage",
        "water_requirement": "Low to Moderate (Drip irrigation recommended)"
    },
    "banana": {
        "category": "Horticultural Fruit",
        "icon": "🍌",
        "season": "Year-round planting in warm humid tropics",
        "ideal_soil": "Deep, rich, fertile loamy soil with high organic matter",
        "water_requirement": "High (Constant moisture without aeration loss)"
    },
    "mango": {
        "category": "Horticultural Fruit",
        "icon": "🥭",
        "season": "Summer harvest (Flowering in winter)",
        "ideal_soil": "Deep alluvial and lateritic soils with good drainage (pH 5.5-7.5)",
        "water_requirement": "Moderate (Requires dry spell for flowering)"
    },
    "grapes": {
        "category": "Horticultural Fruit",
        "icon": "🍇",
        "season": "Perennial vine (Pruning cycles dictate harvest)",
        "ideal_soil": "Well-drained sandy loam to red loams without salt accumulation",
        "water_requirement": "Moderate (Precise irrigation required)"
    },
    "watermelon": {
        "category": "Cucurbit / Summer Fruit",
        "icon": "🍉",
        "season": "Zaid (Summer)",
        "ideal_soil": "Sandy loam rich in organic matter; warm soil accelerates growth",
        "water_requirement": "Moderate (Avoid leaf wetting to prevent fungal blight)"
    },
    "muskmelon": {
        "category": "Cucurbit / Summer Fruit",
        "icon": "🍈",
        "season": "Zaid (Summer)",
        "ideal_soil": "Sandy loam with warm microclimate and slightly acidic to neutral pH",
        "water_requirement": "Moderate"
    },
    "apple": {
        "category": "Temperate Fruit",
        "icon": "🍏",
        "season": "Temperate (Requires chilling hours < 7°C)",
        "ideal_soil": "Well-drained, deep, loamy soils rich in organic matter (pH 5.5-6.5)",
        "water_requirement": "Moderate (Uniform rainfall or drip moisture)"
    },
    "orange": {
        "category": "Citrus Fruit",
        "icon": "🍊",
        "season": "Subtropical / Tropical",
        "ideal_soil": "Well-drained sandy loam or alluvial soil free of impervious hardpan",
        "water_requirement": "Moderate"
    },
    "papaya": {
        "category": "Tropical Fruit",
        "icon": "🍈",
        "season": "Year-round",
        "ideal_soil": "Rich, porous, well-aerated loam; highly intolerant of waterlogging",
        "water_requirement": "Moderate to High"
    },
    "coconut": {
        "category": "Plantation Crop",
        "icon": "🥥",
        "season": "Perennial coastal / tropical",
        "ideal_soil": "Sandy loam, alluvial, and coastal red loam with good percolation",
        "water_requirement": "High (Needs high relative humidity and warm breeze)"
    },
    "cotton": {
        "category": "Fiber / Cash Crop",
        "icon": "☁️",
        "season": "Kharif",
        "ideal_soil": "Deep black cotton soils (regur) with moisture retention",
        "water_requirement": "Moderate (Bright sunshine and dry harvesting period essential)"
    },
    "jute": {
        "category": "Fiber / Cash Crop",
        "icon": "🌾",
        "season": "Kharif (Warm, humid monsoon)",
        "ideal_soil": "Alluvial flood plains, new sandy silt loams",
        "water_requirement": "High (Requires abundant water for retting and growth)"
    },
    "coffee": {
        "category": "Beverage / Plantation Crop",
        "icon": "☕",
        "season": "Subtropical / Tropical Highlands",
        "ideal_soil": "Humus-rich, porous, volcanic or forest loam (pH 5.0-6.5)",
        "water_requirement": "Moderate to High (Requires shade trees and moderate elevation)"
    }
}

# Domain validity boundaries (hard physiological bounds)
DOMAIN_RANGES = {
    "N": {"min": 0.0, "max": 200.0, "unit": "kg/ha", "label": "Nitrogen"},
    "P": {"min": 0.0, "max": 200.0, "unit": "kg/ha", "label": "Phosphorus"},
    "K": {"min": 0.0, "max": 300.0, "unit": "kg/ha", "label": "Potassium"},
    "temperature": {"min": -10.0, "max": 60.0, "unit": "°C", "label": "Temperature"},
    "humidity": {"min": 0.0, "max": 100.0, "unit": "%", "label": "Relative Humidity"},
    "ph": {"min": 0.0, "max": 14.0, "unit": "pH scale", "label": "Soil pH"},
    "rainfall": {"min": 0.0, "max": 600.0, "unit": "mm", "label": "Rainfall"}
}


def load_model_and_metrics():
    """Loads the trained model pipeline and evaluation metrics at application startup."""
    global model_pipeline, model_metrics
    try:
        if os.path.exists(MODEL_PATH):
            model_pipeline = joblib.load(MODEL_PATH)
            logger.info(f"Successfully loaded trained model pipeline from {MODEL_PATH}")
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}. Run train_model.py first!")

        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                model_metrics = json.load(f)
            logger.info(f"Successfully loaded model metrics from {METRICS_PATH}")
        else:
            logger.warning(f"Metrics file not found at {METRICS_PATH}.")
    except Exception as e:
        logger.error(f"Error during model/metrics initialization: {e}", exc_info=True)


# Load once at startup
load_model_and_metrics()


# -----------------------------------------------------------------------------
# Frontend Routes
# -----------------------------------------------------------------------------

@app.route("/")
def index():
    """Serves the main AgriSmart dashboard interface."""
    return render_template("index.html")


@app.route("/reports/<path:filename>")
def serve_reports(filename):
    """Serves generated report visualizations (charts, confusion matrix)."""
    return send_from_directory(REPORTS_DIR, filename)


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    """Checks service health, model availability, and class readiness."""
    is_ready = model_pipeline is not None
    classes_count = len(model_pipeline.classes_) if is_ready and hasattr(model_pipeline, "classes_") else 0
    
    return jsonify({
        "status": "healthy" if is_ready else "degraded",
        "model_loaded": is_ready,
        "model_type": "RandomForestClassifier Pipeline" if is_ready else None,
        "classes_count": classes_count,
        "features": feature_names,
        "message": "AgriSmart service is operational." if is_ready else "Model not loaded. Please train model."
    }), 200 if is_ready else 503


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Returns actual cross-validation and test set evaluation results."""
    if not model_metrics:
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return jsonify(data), 200
        return jsonify({
            "error": "Metrics unavailable",
            "message": "Model metrics file does not exist yet. Please run train_model.py."
        }), 404

    return jsonify(model_metrics), 200


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Validates the 7 soil and environmental inputs, runs inference through
    the trained Random Forest model, and returns predicted crop with alternatives,
    distribution warnings, and agronomic context.
    """
    if model_pipeline is None:
        return jsonify({
            "status": "error",
            "error_type": "ModelNotLoaded",
            "message": "Model pipeline is not loaded on the server. Please ensure train_model.py has been executed."
        }), 503

    # 1. Parse JSON payload
    if not request.is_json:
        return jsonify({
            "status": "error",
            "error_type": "InvalidFormat",
            "message": "Request payload must be formatted as application/json."
        }), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "error_type": "InvalidPayload",
            "message": "Payload must be a JSON object containing the 7 input features."
        }), 400

    # 2. Field existence and numerical validation
    validation_errors = []
    clean_inputs = {}

    for feature in feature_names:
        if feature not in data:
            validation_errors.append(f"Missing required parameter '{feature}'.")
            continue

        val = data[feature]
        # Check null or empty
        if val is None or (isinstance(val, str) and val.strip() == ""):
            validation_errors.append(f"Parameter '{feature}' cannot be empty.")
            continue

        # Convert to float
        try:
            val_float = float(val)
        except (ValueError, TypeError):
            validation_errors.append(f"Parameter '{feature}' must be a valid finite number. Received: {val}")
            continue

        # Check finiteness (no NaN or inf)
        if not np.isfinite(val_float):
            validation_errors.append(f"Parameter '{feature}' cannot be NaN or infinite.")
            continue

        # Check domain boundaries
        bounds = DOMAIN_RANGES[feature]
        if val_float < bounds["min"] or val_float > bounds["max"]:
            validation_errors.append(
                f"{bounds['label']} ({feature}) value {val_float} is outside realistic physical limits "
                f"[{bounds['min']} - {bounds['max']} {bounds['unit']}]."
            )
            continue

        clean_inputs[feature] = val_float

    if validation_errors:
        return jsonify({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Input validation failed. Please correct the specified fields.",
            "details": validation_errors
        }), 422

    # 3. Training Distribution Checks (Out-of-Distribution Warning)
    # Check against empirical min and max from dataset to inform the user
    distribution_warnings = []
    dataset_ranges = model_metrics.get("feature_ranges", {})

    for feature, val in clean_inputs.items():
        if feature in dataset_ranges:
            feat_min = dataset_ranges[feature]["min"]
            feat_max = dataset_ranges[feature]["max"]
            if val < feat_min or val > feat_max:
                distribution_warnings.append(
                    f"{DOMAIN_RANGES[feature]['label']} ({val} {DOMAIN_RANGES[feature]['unit']}) is outside the training "
                    f"distribution range [{feat_min:.1f} to {feat_max:.1f}]. Predictions in extreme conditions carry reduced statistical reliability."
                )

    # 4. Perform Inference with Model Pipeline
    try:
        # Preserve exact feature ordering as a pandas DataFrame
        input_df = pd.DataFrame([clean_inputs], columns=feature_names)

        # Primary class prediction
        predicted_crop = model_pipeline.predict(input_df)[0]

        # Class probabilities from Random Forest ensemble
        probabilities = model_pipeline.predict_proba(input_df)[0]
        classes = model_pipeline.classes_

        # Rank all predictions by score
        ranked_indices = np.argsort(probabilities)[::-1]
        top_recommendations = []

        for idx in ranked_indices[:3]:
            crop_name = str(classes[idx])
            prob = float(probabilities[idx])
            meta = CROP_METADATA.get(crop_name, {})
            top_recommendations.append({
                "crop": crop_name,
                "crop_display": crop_name.capitalize(),
                "probability": round(prob, 4),
                "confidence_percent": round(prob * 100, 1),
                "category": meta.get("category", "Agricultural Crop"),
                "icon": meta.get("icon", "🌱")
            })

        primary_meta = CROP_METADATA.get(predicted_crop, {
            "category": "Agricultural Crop",
            "icon": "🌱",
            "season": "Consult local Krishi Vigyan Kendra / agricultural extension",
            "ideal_soil": "Loamy soil with balanced N-P-K",
            "water_requirement": "Moderate"
        })

        top_confidence = top_recommendations[0]["confidence_percent"]

        response_payload = {
            "status": "success",
            "prediction": {
                "crop": predicted_crop,
                "crop_display": predicted_crop.capitalize(),
                "confidence_percent": top_confidence,
                "category": primary_meta.get("category"),
                "icon": primary_meta.get("icon"),
                "season": primary_meta.get("season"),
                "ideal_soil": primary_meta.get("ideal_soil"),
                "water_requirement": primary_meta.get("water_requirement"),
                "top_recommendations": top_recommendations,
                "distribution_warnings": distribution_warnings,
                "input_summary": clean_inputs,
                "advisory_disclaimer": (
                    "Notice: Predictions are computed based on statistical associations in the training dataset. "
                    "Infield farming decisions require localized validation with agronomists considering seed variety, "
                    "pest risks, microclimates, and water availability."
                )
            }
        }
        return jsonify(response_payload), 200

    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "error_type": "InferenceError",
            "message": "An unexpected error occurred during prediction inference.",
            "details": str(e)
        }), 500


@app.route("/api/crops", methods=["GET"])
def get_crops():
    """
    GET /api/crops
    Returns list of all 22 supported crops with icons, categories,
    and agronomic growth parameters for interactive exploration.
    """
    crops_list = []
    for crop_id, meta in CROP_METADATA.items():
        crops_list.append({
            "id": crop_id,
            "crop": crop_id,
            "crop_display": crop_id.capitalize(),
            "category": meta.get("category", "Agricultural Crop"),
            "icon": meta.get("icon", "🌱"),
            "season": meta.get("season", "Optimal Season"),
            "ideal_soil": meta.get("ideal_soil", "Loamy soil"),
            "water_requirement": meta.get("water_requirement", "Moderate")
        })
    return jsonify({
        "status": "success",
        "total_crops": len(crops_list),
        "crops": crops_list
    }), 200


# -----------------------------------------------------------------------------
# Error Handlers
# -----------------------------------------------------------------------------

@app.errorhandler(404)
def not_found_handler(e):
    if request.path.startswith("/api/"):
        return jsonify({
            "status": "error",
            "error_type": "NotFound",
            "message": f"Resource not found: {request.path}"
        }), 404
    return render_template("index.html"), 404


@app.errorhandler(500)
def server_error_handler(e):
    return jsonify({
        "status": "error",
        "error_type": "InternalServerError",
        "message": "An internal server error occurred."
    }), 500


if __name__ == "__main__":
    logger.info("Starting AgriSmart Flask Server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
