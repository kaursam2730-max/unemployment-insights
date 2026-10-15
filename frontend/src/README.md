# India Unemployment Insights

An interactive analytics dashboard on unemployment in India. It covers the 2020 lockdown shock (CMIE data, May 2019 to Jun 2020) and the current labour market (PLFS monthly bulletins, 2025-26).

**Live demo:** https://unemployment-insights.vercel.app

## Features

- **Dashboard:** KPI cards, trend chart and auto-generated insights for any state
- **Time slider with Play:** watch the lockdown spike unfold month by month
- **India map:** tile map coloured by unemployment rate, click a state to drill down
- **Compare:** up to 4 states on one chart
- **Insights:** resilience score per state and early warning flags for sudden jumps
- **Ask data:** plain-English questions with the SQL shown
- **Shock simulator:** change lockdown length and government support, see the projected path
- **Forecast toggle:** 6-month illustrative projection
- **India now:** latest PLFS figures (overall, urban, rural, participation)

## Tech stack

| Layer | Tools |
|-------|-------|
| Frontend | React, Vite, Recharts |
| Backend | FastAPI, SQLAlchemy, pandas |
| Database | SQLite |
| Deployment | Vercel (frontend), Render (backend) |

## Project structure

```
backend/    FastAPI app, data cleaning scripts, SQLite database
frontend/   React dashboard
```

## Run locally

Backend:
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend (new terminal):
```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `/regions` | List of states |
| `/kpis` | Average, peak and participation (optional `region`, `area`) |
| `/trends` | Monthly rate (optional `region`, `area`) |
| `/states` | Average rate by state |
| `/monthly` | Monthly rate and participation for every state |
| `/plfs` | PLFS monthly bulletin data |

## Data sources

- CMIE unemployment data, 2019-20 (Kaggle)
- PLFS monthly bulletins, MoSPI, 2025-26

CMIE and PLFS use different survey methods, so the two datasets are not directly comparable.

## Notes

- The forecast and simulator are exploratory models, not official predictions.
- The backend runs on a free Render plan and sleeps when idle, so the first load can take up to a minute.