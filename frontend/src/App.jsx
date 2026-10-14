import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const API = "http://127.0.0.1:8000";
const pct = (v) => (v == null ? "-" : v + "%");

function Card({ label, value }) {
  return (
    <div className="card">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("lockdown");
  const [regions, setRegions] = useState([]);
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [kpis, setKpis] = useState({});
  const [trend, setTrend] = useState([]);
  const [states, setStates] = useState([]);
  const [plfs, setPlfs] = useState([]);
  const [error, setError] = useState("");

  const qs = (obj) => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => v && p.append(k, v));
    const s = p.toString();
    return s ? "?" + s : "";
  };

  useEffect(() => {
    fetch(`${API}/regions`).then((r) => r.json()).then(setRegions)
      .catch(() => setError("Backend se connect nahi ho pa raha. Server chal raha hai?"));
    fetch(`${API}/plfs`).then((r) => r.json()).then(setPlfs).catch(() => {});
  }, []);

  useEffect(() => {
    const q = qs({ region, area });
    fetch(`${API}/kpis${q}`).then((r) => r.json()).then(setKpis).catch(() => {});
    fetch(`${API}/trends${q}`).then((r) => r.json()).then(setTrend).catch(() => {});
    fetch(`${API}/states${qs({ area })}`).then((r) => r.json()).then(setStates).catch(() => {});
  }, [region, area]);

  const latest = plfs[plfs.length - 1] || {};

  return (
    <div className="wrap">
      <h1>India Unemployment Analytics</h1>
      <p className="sub">CMIE data (2019-20) and PLFS bulletins (2025-26)</p>
      {error && <p className="err">{error}</p>}

      <div className="tabs">
        <button className={tab === "lockdown" ? "on" : ""} onClick={() => setTab("lockdown")}>Lockdown study</button>
        <button className={tab === "now" ? "on" : ""} onClick={() => setTab("now")}>India now</button>
      </div>

      {tab === "lockdown" && (
        <>
          <div className="filters">
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">All states</option>
              {regions.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Rural + Urban</option>
              <option>Rural</option>
              <option>Urban</option>
            </select>
          </div>
          <div className="kpis">
            <Card label="Average rate" value={pct(kpis.avg_rate)} />
            <Card label="Peak rate" value={pct(kpis.peak_rate)} />
            <Card label="Labour participation" value={pct(kpis.labour_participation)} />
            <Card label="Records" value={kpis.records ?? "-"} />
          </div>
          <div className="grid">
            <div className="card">
              <h3>Trend over time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>Top 10 states by average rate</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={states.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" />
                 <YAxis type="category" dataKey="region" width={110} interval={0} />
                  <Tooltip />
                  <Bar dataKey="avg_rate" fill="#d9482b" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === "now" && (
        <>
          <div className="kpis">
            <Card label={`Overall (${latest.month || "-"})`} value={pct(latest.overall)} />
            <Card label="Rural" value={pct(latest.rural)} />
            <Card label="Urban" value={pct(latest.urban)} />
            <Card label="Participation" value={pct(latest.lfpr)} />
          </div>
          <div className="card">
            <h3>Monthly unemployment rate (PLFS)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={plfs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis unit="%" domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="overall" stroke="#2a78d6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="urban" stroke="#eb6834" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="rural" stroke="#1baf7a" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}