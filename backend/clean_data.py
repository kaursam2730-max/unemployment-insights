import pandas as pd

df = pd.read_csv("data/Unemployment in India (1).csv")
print("Original columns:", df.columns.tolist())

# column names saaf karo
df.columns = (df.columns.str.strip().str.lower()
              .str.replace(r"[^a-z0-9]+", "_", regex=True).str.strip("_"))
df = df.rename(columns={
    "estimated_unemployment_rate": "unemployment_rate",
    "estimated_employed": "employed",
    "estimated_labour_participation_rate": "labour_participation",
})

# text values ke aage-peeche ki space hatao
for c in df.select_dtypes("object").columns:
    df[c] = df[c].str.strip()

# date theek karo
df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")

print("\nMissing values:\n", df.isna().sum())
df = df.dropna()

print("\nShape:", df.shape)
print("Date range:", df["date"].min().date(), "to", df["date"].max().date())
print(df.head())

df.to_csv("data/clean_unemployment.csv", index=False)
print("\nSaved: data/clean_unemployment.csv")