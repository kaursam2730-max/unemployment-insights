import pandas as pd
from sqlalchemy import create_engine

df = pd.read_csv("data/clean_unemployment.csv", parse_dates=["date"])
engine = create_engine("sqlite:///data/unemployment.db")
df.to_sql("unemployment", engine, if_exists="replace", index=False)

print(pd.read_sql("SELECT COUNT(*) AS total_rows FROM unemployment", engine))
print(pd.read_sql(
    "SELECT region, ROUND(AVG(unemployment_rate), 2) AS avg_rate "
    "FROM unemployment GROUP BY region ORDER BY avg_rate DESC LIMIT 5", engine))