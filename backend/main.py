import json
import pandas as pd
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

app = FastAPI(title="Unemployment API")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

engine = create_engine("sqlite:///data/unemployment.db")

def run(sql, params=None):
    return pd.read_sql(text(sql), engine, params=params or {})

def rows(df):
    return json.loads(df.to_json(orient="records"))

def where(region, area):
    cond, p = [], {}
    if region:
        cond.append("region = :region"); p["region"] = region
    if area:
        cond.append("area = :area"); p["area"] = area
    return (" WHERE " + " AND ".join(cond)) if cond else "", p

@app.get("/")
def home():
    return {"status": "ok", "project": "Unemployment Insights"}

@app.get("/regions")
def regions():
    return run("SELECT DISTINCT region FROM unemployment ORDER BY region")["region"].tolist()

@app.get("/kpis")
def kpis(region: Optional[str] = None, area: Optional[str] = None):
    w, p = where(region, area)
    df = run("SELECT ROUND(AVG(unemployment_rate),2) AS avg_rate, "
             "ROUND(MAX(unemployment_rate),2) AS peak_rate, "
             "ROUND(AVG(labour_participation),2) AS labour_participation, "
             "COUNT(*) AS records FROM unemployment" + w, p)
    return rows(df)[0]

@app.get("/trends")
def trends(region: Optional[str] = None, area: Optional[str] = None):
    w, p = where(region, area)
    df = run("SELECT substr(date,1,7) AS month, ROUND(AVG(unemployment_rate),2) AS rate "
             "FROM unemployment" + w + " GROUP BY month ORDER BY month", p)
    return rows(df)

@app.get("/states")
def states(area: Optional[str] = None):
    w, p = where(None, area)
    df = run("SELECT region, ROUND(AVG(unemployment_rate),2) AS avg_rate "
             "FROM unemployment" + w + " GROUP BY region ORDER BY avg_rate DESC", p)
    return rows(df)

@app.get("/plfs")
def plfs():
    return rows(pd.read_csv("data/plfs_monthly.csv"))

@app.get("/monthly")
def monthly(area: Optional[str] = None):
    w, p = where(None, area)

    df = run("SELECT region, substr(date,1,7) AS month, "
             "ROUND(AVG(unemployment_rate),2) AS rate, "
             "ROUND(AVG(labour_participation),2) AS lfpr "
             "FROM unemployment" + w + " GROUP BY region, month ORDER BY month", p)
    return rows(df)