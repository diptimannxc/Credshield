"""
train_regression.py — Linear regression pipeline for predicted delay days.

Trains a StandardScaler → LinearRegression pipeline to predict the average
number of days a buyer's payment will be delayed, given their risk score
and credit exposure.

Features: [score, exposure] (NOT avg_delay — that's the target)
Target:   avg_delay
"""

import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
import joblib

# Synthetic training data (10 rows) — same as train_model.py
data = pd.DataFrame({
    'score':     [920, 740, 310, 880, 650, 200, 950, 500, 150, 700],
    'avg_delay': [ 62,  38,   8,  55,  30,   5,  70,  25,   2,  40],
    'exposure':  [480000, 210000, 95000, 400000, 180000, 50000, 500000, 150000, 30000, 220000],
})

features = ['score', 'exposure']
X = data[features]
y = data['avg_delay']

# Build and train pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('reg', LinearRegression()),
])
pipeline.fit(X, y)

# Save trained model
joblib.dump(pipeline, 'delay_days_model.pkl')
print("[OK] delay_days_model.pkl saved")

# Test prediction
test_input = pd.DataFrame([{'score': 700, 'exposure': 250000}])
pred = pipeline.predict(test_input)[0]
print(f"Test prediction (score=700, exposure=250000): {pred:.1f} days")
