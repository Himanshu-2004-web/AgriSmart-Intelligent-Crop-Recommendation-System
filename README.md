# AgriSmart — Full-Stack Machine Learning Crop Recommendation System

> **Major Capstone Project (MCA)**  
> **Domain:** Precision Agriculture, Applied Machine Learning, Full-Stack Web Development  
> **Key Highlights:** 2,200 Verified Agro-Climatic Observations • 22 Crop Classes • 5-Fold Stratified Cross-Validation • 99.55% Test Accuracy • Zero Monolithic External Frameworks

---

## 1. Project Overview

**AgriSmart** is an academically rigorous and production-ready full-stack Machine Learning web application designed to assist farmers, agricultural students, and researchers in making data-driven crop suitability decisions. 

By analyzing **seven chemical and meteorological parameters**:
1. **Nitrogen (N)** ratio in soil (kg/ha)
2. **Phosphorus (P)** ratio in soil (kg/ha)
3. **Potassium (K)** ratio in soil (kg/ha)
4. **Ambient Temperature** (°C)
5. **Relative Humidity** (%)
6. **Soil pH Value** (0 – 14 scale)
7. **Precipitation / Rainfall** (mm)

The system passes sanitized inputs through a trained **100-tree Random Forest bagging ensemble pipeline**, producing instant primary crop recommendations, consensus confidence scores, ranked alternative crops, and localized agronomic advisories.

---

## 2. Technology Stack

AgriSmart adheres to a clean, lightweight, and maintainable technology stack without bloated frameworks:

| Layer | Technologies Used | Description / Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Bootstrap 5.3, JavaScript (ES6+), Fetch API | Modern SaaS dashboard layout with custom CSS variables, responsive grid, dynamic DOM updates, and preset demo profiles. |
| **Interactive Visuals** | Chart.js 4.4 | Real-time interactive model comparison bar charts and Gini feature importance visualizations rendered in-browser from live API data. |
| **Backend & Routing** | Python 3.13, Flask 3.1 | RESTful API server providing input sanitization, domain boundary checks, model caching, and health diagnostics. |
| **Machine Learning** | Scikit-learn 1.9, pandas 2.3, NumPy 2.3, joblib 1.5 | Model training, 5-fold cross-validation, metrics calculation, and immutable pipeline serialization. |
| **Evaluation & Reporting**| Matplotlib 3.10, Seaborn 0.13 | High-resolution confusion matrix heatmaps and model comparison plots. |
| **Testing** | Python `unittest` | Automated test suite validating API contracts, status codes, input validations, and error handling. |

---

## 3. Project Directory Structure

```text
Agri_Smart/
├── data/
│   └── Crop_recommendation.csv    # 2,200 rows x 8 columns dataset (22 crop classes)
├── models/
│   ├── crop_model.joblib          # Serialized production Random Forest pipeline
│   └── model_metrics.json         # Real cross-validation & test evaluation metrics
├── reports/
│   ├── model_comparison.png       # Decision Tree vs. Random Forest comparative chart
│   └── confusion_matrix.png       # 22x22 multi-class confusion matrix on held-out test data
├── static/
│   ├── css/
│   │   └── style.css              # Custom styling (Forest emerald, slate, animations)
│   ├── images/
│   │   ├── confusion_matrix.png   # Static asset copy for web dashboard modal
│   │   └── model_comparison.png   # Static asset copy for web dashboard
│   └── js/
│       └── script.js              # Client-side validation, async fetch(), Chart.js
├── templates/
│   └── index.html                 # Main dashboard template with all UI sections
├── app.py                         # Flask backend application & REST API endpoints
├── train_model.py                 # End-to-end ML training & validation pipeline
├── test_app.py                    # Automated test suite (7 comprehensive test cases)
├── requirements.txt               # Locked project dependencies
├── .gitignore                     # Git ignore rules for virtualenv and cache
└── README.md                      # Academic documentation & viva defense guide
```

---

## 4. Quick Start & Execution Guide (Windows)

### Step 1: Clone / Open Directory
Open PowerShell or Command Prompt in the project folder:
```powershell
cd c:\Users\anshu\Desktop\Agri_Smart
```

### Step 2: (Optional) Create & Activate Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Required Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Train & Evaluate the Machine Learning Models
Execute the ML pipeline. This trains both Decision Tree and Random Forest, performs 5-fold cross-validation, evaluates on the held-out test set, saves `models/crop_model.joblib`, generates `models/model_metrics.json`, and outputs the report figures:
```powershell
python train_model.py
```

### Step 5: Run Automated Unit Tests
Verify that all API endpoints, validation routines, and model pipelines pass:
```powershell
python -m unittest test_app.py
```
*(You will see 7 passed unit tests: `OK`)*

### Step 6: Launch the Web Application
Start the Flask server:
```powershell
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 5. Machine Learning Experimentation & Results

### 5.1 Dataset Overview
- **Source:** Verified Indian Council of Agricultural Research (ICAR) & public agricultural data.
- **Samples:** 2,200 observations (100 samples per crop class).
- **Target Variable (`label`):** 22 distinct crops:
  - *Cereals & Grains:* Rice, Maize
  - *Pulses & Legumes:* Chickpea, Kidneybeans, Pigeonpeas, Mothbeans, Mungbean, Blackgram, Lentil
  - *Fruits & Horticultural:* Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya
  - *Fiber & Cash Crops:* Coconut, Cotton, Jute, Coffee
- **Missing Values / Duplicates:** 0 missing values, 0 duplicate rows.

### 5.2 Train / Held-Out Test Split
- **Training Set (80%):** 1,760 samples (80 samples per class, stratified).
- **Held-Out Test Set (20%):** 440 samples (20 samples per class, stratified).
- **Seed:** Fixed `random_state = 42` for exact academic reproducibility.

### 5.3 5-Fold Stratified Cross-Validation on Training Data
Cross-validation was conducted exclusively on the 1,760 training samples to prevent test data leakage:

| Algorithm | Mean CV Accuracy | Macro CV Precision | Macro CV Recall | Macro CV F1-Score |
|---|---|---|---|---|
| **Decision Tree** | 98.47% ± 0.64% | 98.55% ± 0.63% | 98.47% ± 0.64% | 98.46% ± 0.64% |
| **Random Forest (Selected)** | **99.43% ± 0.51%** | **99.49% ± 0.44%** | **99.43% ± 0.51%** | **99.43% ± 0.51%** |

### 5.4 Final Evaluation on Unobserved Held-Out Test Set (440 Samples)

| Evaluation Metric | Decision Tree | Random Forest | Advantage / Delta |
|---|---|---|---|
| **Test Accuracy** | 98.18% | **99.55%** | +1.37% |
| **Macro Precision** | 98.30% | **99.57%** | +1.27% |
| **Macro Recall** | 98.18% | **99.55%** | +1.37% |
| **Macro F1-Score** | 98.17% | **99.55%** | +1.38% |

### 5.5 Gini Feature Importance Ranking (Random Forest)
The ensemble identified the most discriminatory agro-environmental features:
1. **Rainfall (mm):** ~22.6% importance
2. **Relative Humidity (%):** ~21.5% importance
3. **Potassium (K):** ~17.8% importance
4. **Phosphorus (P):** ~14.8% importance
5. **Nitrogen (N):** ~10.9% importance
6. **Temperature (°C):** ~7.3% importance
7. **Soil pH:** ~5.1% importance

---

## 6. Backend API Specification

### 1. `GET /api/health`
Checks server readiness, model loading state, and registered classes.
- **Response (200 OK):**
```json
{
  "classes_count": 22,
  "features": ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"],
  "message": "AgriSmart service is operational.",
  "model_loaded": true,
  "model_type": "RandomForestClassifier Pipeline",
  "status": "healthy"
}
```

### 2. `GET /api/metrics`
Returns real saved experimental metrics from `models/model_metrics.json`.

### 3. `POST /api/predict`
Validates the 7 soil and climate inputs and returns the recommendation payload.
- **Request Body (`application/json`):**
```json
{
  "N": 90.0,
  "P": 42.0,
  "K": 43.0,
  "temperature": 20.8,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```
- **Response Body (200 OK):**
```json
{
  "prediction": {
    "crop": "rice",
    "crop_display": "Rice",
    "category": "Cereal / Grain",
    "confidence_percent": 91.9,
    "distribution_warnings": [],
    "ideal_soil": "Clayey, alluvial loam with high water-retention capacity",
    "season": "Kharif (Monsoon)",
    "water_requirement": "High (Standing water required during vegetative phase)",
    "top_recommendations": [
      { "crop": "rice", "crop_display": "Rice", "confidence_percent": 91.9, "category": "Cereal / Grain" },
      { "crop": "jute", "crop_display": "Jute", "confidence_percent": 5.2, "category": "Fiber / Cash Crop" },
      { "crop": "cotton", "crop_display": "Cotton", "confidence_percent": 1.4, "category": "Fiber / Cash Crop" }
    ],
    "advisory_disclaimer": "Predictions are computed based on statistical associations..."
  },
  "status": "success"
}
```
- **Error Responses:**
  - `400 Bad Request`: Payload is not JSON or missing required object.
  - `422 Unprocessable Entity`: Field missing, non-numeric value, or value outside physical limits.

---

## 7. MCA Viva Examination Defense Guide

When presenting this project to your external examiner and professors, reference these key theoretical concepts:

### Q1: Why compare Decision Tree against Random Forest?
> **Answer:** "A single Decision Tree makes orthogonal, greedy feature splits that create low bias but high variance; small shifts in training observations drastically alter the tree structure. Random Forest is an ensemble method that builds 100 decorrelated trees via *Bootstrap Aggregating (Bagging)* and *Random Subspace Feature Selection*. By averaging probability distributions across 100 trees, variance is substantially minimized without increasing bias. In our actual test experiment, Random Forest outperformed the single tree by over 1.37% (99.55% vs 98.18%)."

### Q2: Why evaluate using Macro F1-Score instead of only Accuracy?
> **Answer:** "In multi-class problems (22 crop classes), standard accuracy calculates overall correct predictions over total predictions. If one rare or sensitive class were misclassified, accuracy could still look deceptively high. Macro F1-Score computes the harmonic mean of precision and recall for each class individually and takes the unweighted arithmetic mean:
> $$\text{Macro F1} = \frac{1}{K} \sum_{k=1}^K F1_k$$
> This guarantees that each crop—from staple rice to specialized coffee—receives equal mathematical weight."

### Q3: What would SVM and k-NN do, and why were they excluded?
> **Answer:** 
> 1. **Support Vector Machine (SVM):** Requires mandatory feature standardization (`StandardScaler`), has high quadratic-to-cubic training computational overhead ($O(N^2 \cdot D)$ to $O(N^3)$), and lacks intuitive tree-based Gini feature importance interpretability.
> 2. **k-Nearest Neighbors (k-NN):** As an instance-based lazy learner, k-NN stores all 2,200 data points. On every single web request, it must calculate 2,200 Euclidean distance computations ($O(N \cdot D)$), causing higher server latency and vulnerability to differing feature magnitudes (e.g., rainfall up to 300 mm vs pH between 3 and 9).
> 
> Tree ensembles inherently handle heterogeneous non-linear scales without mandatory feature normalization and provide instant sub-millisecond inference.

### Q4: Why load the model once into memory rather than retraining on each request?
> **Answer:** "Retraining on every request violates production software engineering principles:
> 1. Training incurs CPU/RAM overhead and high response latency (hundreds of milliseconds vs <2 ms inference).
> 2. It introduces data drift risks and potential nondeterminism.
> In AgriSmart, we separate offline model training (`train_model.py`) from online serving (`app.py`), serializing the pipeline using `joblib` and loading it once at application startup."

### Q5: How does the system handle Out-of-Distribution (OOD) queries?
> **Answer:** "Real-world users may input extreme climate or soil readings (e.g. 500 mm rainfall or 55°C heat). While these may be valid numbers, they fall outside the empirical bounds of our training data. Rather than giving false confidence, AgriSmart's backend flags these conditions with an explicit **Distribution Boundary Advisory**, informing the user that predictions in extreme conditions carry reduced statistical reliability."

---

## 8. Real-World Agricultural Limitations

AgriSmart provides an academic diagnostic baseline. Field farming decisions must account for factors outside the dataset:
1. **Economic Factors:** Market price fluctuations, Minimum Support Price (MSP), cold storage availability, and transportation proximity.
2. **Biological & Pathological Risks:** Local seed hybrid varieties, fungal/bacterial pest pressures, and historical crop rotation cycles.
3. **Water Governance:** Canal availability, borewell groundwater tables, and seasonal monsoon delays.

---

## 9. Academic Attributions & License

- **Course:** Master of Computer Applications (MCA) Major Project
- **Dataset:** Open Crop Recommendation Dataset (2,200 ICAR-aligned records)
- **License:** MIT License — Open for academic, research, and non-commercial educational use.
