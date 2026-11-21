"""
train_model.py — Binary classification pipeline for delay prediction.

Trains a StandardScaler → LogisticRegression pipeline to predict whether
a buyer's invoice payment will be delayed (was_delayed = 1) or on time (0).

WHY StandardScaler IS NEEDED:
Without scaling, `exposure` (values in hundreds of thousands) completely
swamps `score` (hundreds) and `avg_delay` (tens). The model ends up just
thresholding on exposure alone — predictions snap to 0% or 100% with no
nuance. StandardScaler normalises each feature to zero mean / unit variance,
so Logistic Regression can learn meaningful coefficients for all three.
"""

import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
import joblib

# Synthetic training data (10 rows)
data = pd.DataFrame({
    'score':      [920, 740, 310, 880, 650, 200, 950, 500, 150, 700],
    'avg_delay':  [ 62,  38,   8,  55,  30,   5,  70,  25,   2,  40],
    'exposure':   [480000, 210000, 95000, 400000, 180000, 50000, 500000, 150000, 30000, 220000],
    'was_delayed':[  1,   1,   0,   1,   0,   0,   1,   0,   0,   1],
})

features = ['score', 'avg_delay', 'exposure']
X = data[features]
y = data['was_delayed']

# Build and train pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', LogisticRegression(max_iter=1000)),
])
pipeline.fit(X, y)

# Save trained model
joblib.dump(pipeline, 'risk_model.pkl')
print("[OK] risk_model.pkl saved")

# Test prediction — high-risk profile
test_input = pd.DataFrame([{'score': 920, 'avg_delay': 62, 'exposure': 480000}])
prob = pipeline.predict_proba(test_input)[0][1]
print(f"Test prediction (score=920, avg_delay=62, exposure=480000): {prob*100:.1f}% delay probability")
