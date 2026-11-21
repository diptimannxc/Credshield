# CredShield — Predict, Protect, Prevent

AI-powered credit risk intelligence platform for MSMEs. Predicts payment delays, scores buyer risk, and provides actionable insights to protect your cashflow.

Built for **LeanIn Hacks 2026**.

## Architecture

```
React Frontend (:5173)  →  Express Backend (:3000)  →  MySQL (:3306)
                                    ↓
                           Flask ML Service (:5000)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ with `scikit-learn`, `flask`, `pandas`, `joblib`
- MySQL 8.0+

### 1. Database Setup
```bash
mysql -u root -p < credshield-backend/database/schema.sql
```

### 2. Train ML Models
```bash
cd credshield-ml
python train_model.py
python train_regression.py
```

### 3. Start All Services
Double-click `start.bat` or run manually:
```bash
# Terminal 1 — ML Service
cd credshield-ml && python predict_api.py

# Terminal 2 — Backend
cd credshield-backend && npm start

# Terminal 3 — Frontend
cd credshield-frontend && npm run dev
```

Open **http://localhost:5173**

## Features

| Feature | Description |
|---|---|
| Dashboard | KPI cards, cashflow chart, heatmap, risk alerts, actionable insights |
| Buyer Portfolio | Searchable table, detail drawer, score ring, add/delete buyers |
| Invoices | Sortable table, status filters, pagination, CSV upload, mark paid |
| Risk Analysis | What-if simulator with sliders, live ML predictions, buyer ranking |
| Reports | Executive risk report with print support |
| Onboarding | 3-step wizard to onboard first buyer + invoice |
| Landing Page | Animated node graph, crosshair cursor, GSAP entrance |

## Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, GSAP, Lucide Icons
- **Backend:** Express 5, mysql2, multer, csv-parse
- **ML:** scikit-learn (LogisticRegression + LinearRegression), Flask
- **Database:** MySQL 8.0

## ML Models

| Model | Type | Input | Output |
|---|---|---|---|
| `risk_model.pkl` | Classification | score, avg_delay, exposure | Delay probability (0-100%) |
| `delay_days_model.pkl` | Regression | score, exposure | Predicted delay days |

## Team

Built by Team CredShield — LeanIn Hacks 2026
