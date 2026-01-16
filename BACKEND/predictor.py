from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)   # ⭐ VERY IMPORTANT (frontend-backend connection)

# Dummy / processed data (replace later with ML output)
historical_data = [
    {"date": "2024-01", "price": 2200},
    {"date": "2024-06", "price": 2600},
    {"date": "2025-01", "price": 3000}
]

predicted_data = [
    {"date": "2025-06", "price": 3400},
    {"date": "2026-01", "price": 4200}
]

@app.route("/predict")
def predict():
    return jsonify({
        "historical": historical_data,
        "predicted": predicted_data
    })

if __name__ == "__main__":
    app.run(debug=True)
