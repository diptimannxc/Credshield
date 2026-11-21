"""
predict_api.py — Flask microservice serving live risk predictions.

Loads both trained .pkl models at startup and exposes a single
POST /predict endpoint that returns delay probability and predicted days.
"""

from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load trained models at startup
risk_model = joblib.load('risk_model.pkl')
delay_model = joblib.load('delay_days_model.pkl')
print("[OK] Models loaded: risk_model.pkl, delay_days_model.pkl")


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)

    # Validate required fields
    required = ['score', 'avg_delay', 'exposure']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    score = float(data['score'])
    avg_delay = float(data['avg_delay'])
    exposure = float(data['exposure'])

    # Classification: delay probability (0-100%)
    risk_input = pd.DataFrame([{
        'score': score,
        'avg_delay': avg_delay,
        'exposure': exposure,
    }])
    delay_probability = int(round(risk_model.predict_proba(risk_input)[0][1] * 100))

    # Regression: predicted delay in days
    delay_input = pd.DataFrame([{
        'score': score,
        'exposure': exposure,
    }])
    predicted_days = max(0, round(float(delay_model.predict(delay_input)[0]), 1))

    return jsonify({
        'delayProbability': delay_probability,
        'predictedDays': predicted_days,
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
