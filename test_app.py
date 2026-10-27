"""
AgriSmart — Automated Test Suite
Verifies all Flask API endpoints, ML prediction behavior,
input validation rules, and error handling.
"""

import unittest
import json
from app import app

class AgriSmartTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_health_check(self):
        """Test GET /api/health returns healthy and model loaded."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_loaded"])
        self.assertEqual(data["classes_count"], 22)

    def test_metrics_endpoint(self):
        """Test GET /api/metrics returns real model metrics."""
        response = self.client.get("/api/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("dataset_info", data)
        self.assertIn("cross_validation_results", data)
        self.assertIn("test_results", data)
        self.assertIn("selected_model", data)
        self.assertEqual(data["selected_model"]["name"], "Random Forest")

    def test_crops_endpoint(self):
        """Test GET /api/crops returns 22 crops."""
        response = self.client.get("/api/crops")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["total_crops"], 22)
        self.assertEqual(len(data["crops"]), 22)

    def test_predict_success(self):
        """Test POST /api/predict with canonical rice input."""
        payload = {
            "N": 90.0,
            "P": 42.0,
            "K": 43.0,
            "temperature": 20.8,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 202.9
        }
        response = self.client.post(
            "/api/predict",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("prediction", data)
        self.assertEqual(data["prediction"]["crop"], "rice")
        self.assertGreater(data["prediction"]["confidence_percent"], 50)
        self.assertEqual(len(data["prediction"]["top_recommendations"]), 3)

    def test_predict_missing_feature(self):
        """Test POST /api/predict fails when feature is missing."""
        payload = {
            "N": 90.0,
            "P": 42.0,
            "K": 43.0,
            # missing temperature
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 202.9
        }
        response = self.client.post(
            "/api/predict",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 422)
        data = response.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("temperature", str(data["details"]))

    def test_predict_invalid_data_type(self):
        """Test POST /api/predict fails when string/letter given for numerical value."""
        payload = {
            "N": "high",
            "P": 42.0,
            "K": 43.0,
            "temperature": 20.8,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 202.9
        }
        response = self.client.post(
            "/api/predict",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 422)
        data = response.get_json()
        self.assertEqual(data["status"], "error")

    def test_predict_out_of_physical_domain(self):
        """Test POST /api/predict fails when pH is physically impossible (> 14)."""
        payload = {
            "N": 90.0,
            "P": 42.0,
            "K": 43.0,
            "temperature": 20.8,
            "humidity": 82.0,
            "ph": 17.5, # physically impossible pH
            "rainfall": 202.9
        }
        response = self.client.post(
            "/api/predict",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 422)

    def test_predict_out_of_distribution_warning(self):
        """Test POST /api/predict flags out-of-distribution conditions gracefully."""
        payload = {
            "N": 90.0,
            "P": 42.0,
            "K": 43.0,
            "temperature": 20.8,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 450.0  # valid domain (<600) but > dataset max (~298)
        }
        response = self.client.post(
            "/api/predict",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreater(len(data["prediction"]["distribution_warnings"]), 0)

if __name__ == "__main__":
    unittest.main()
