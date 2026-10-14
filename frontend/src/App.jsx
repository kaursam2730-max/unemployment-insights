import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, Legend, ReferenceDot,
} from "recharts";
import "./dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TABS = [
  ["dash", "Dashboard"], ["map", "India map"], ["cmp", "Compare"], ["ins", "Insights"],
  ["ask", "Ask data"], ["sim", "Simulator"], ["now", "India now"],
];
const QS = [
  "Which state recovered fastest?", "Which state had the highest rate?",
  "Which state had the lowest rate?", "Rural vs urban?",
  "What happened in April 2020?", "Average unemployment?",
];

// tile map position: [column, row]
const LAYOUT = {
  "Jammu & Kashmir": [2, 1],
  "Punjab": [1, 2], "Himachal Pradesh": [2, 2], "Uttarakhand": [3, 2],
  "Chandigarh": [0, 3], "Haryana": [1, 3], "Delhi": [2, 3], "Uttar Pradesh": [3, 3],
  "Bihar": [4, 3], "Sikkim": [5, 3], "Assam": [6, 3],
  "Rajasthan": [1, 4], "Madhya Pradesh": [2, 4], "Chhattisgarh": [3, 4], "Jharkhand": [4, 4],
  "West Bengal": [5, 4], "Meghalaya": [6, 4], "Tripura": [7, 4],
  "Gujarat": [0, 5], "Maharashtra": [1, 5], "Telangana": [2, 5], "Odisha": [4, 5],
  "Goa": [1, 6], "Karnataka": [2, 6], "Andhra Pradesh": [3, 6],
  "Kerala": [2, 7], "Tamil Nadu": [3, 7], "Puducherry": [4, 7],
};
const SHORT = {
  "Jammu & Kashmir": "JK", "Punjab": "PB", "Himachal Pradesh": "HP", "Uttarakhand": "UK",
  "Chandigarh": "CH", "Haryana": "HR", "Delhi": "DL", "Uttar Pradesh": "UP", "Bihar": "BR",
  "Sikkim": "SK", "Assam": "AS", "Rajasthan": "RJ", "Madhya Pradesh": "MP", "Chhattisgarh": "CG",
  "Jharkhand": "JH", "West Bengal": "WB", "Meghalaya": "ML", "Tripura": "TR", "Gujarat": "GJ",
  "Maharashtra": "MH", "Telangana": "TS", "Odisha": "OD", "Goa": "GA", "Karnataka": "KA",
  "Andhra Pradesh": "AP", "Kerala": "KL", "Tamil Nadu": "TN", "Puducherry": "PY",
};

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const nums = (a) => a.filter((v) => v != null);
const r1 = (v) => Math.round(v * 10) / 10;
const pct = (v) => (v == null || Number.isNaN(v) ? "-" : r1(v) + "%");
const ml = (m) => {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return MON[+mo - 1] + " " + y.slice(2);
};
const addMonths = (m, n) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
};
const tier = (v) => (v >= 75 ? ["Strong", "#0f766e"] : v >= 55 ? ["Moderate", "#c98500"] : ["Fragile", "#d9482b"]);

function Card({ label, value, hot }) {
  return (
    <div className="card">
      <small>{label}</small>
      <b className={hot ? "u-hot" : ""}>{value}</b>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dash");
  const [area, setArea] = useState("");
  const [st, setSt] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [plfs, setPlfs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mi, setMi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fc, setFc] = useState(false);
  const [cmp, setCmp] = useState(["Delhi", "Bihar", "Maharashtra"]);
  const [weeks, setWeeks] = useState(8);
  const [support, setSupport] = useState(30);
  const [qa, setQa] = useState(null);
  const [qtext, setQtext] = useState("");
  const inited = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/monthly${area ? `?area=${area}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setRows(Array.isArray(d) ? d : []); setError(""); })
      .catch(() => setError("Backend se connect nahi ho pa raha. Server chal raha hai?"))
      .finally(() => setLoading(false));
  }, [area]);

  useEffect(() => {
    fetch(`${API}/plfs`).then((r) => r.json()).then(setPlfs).catch(() => {});
  }, []);

  const model = useMemo(() => {
    const months = [...new Set(rows.map((r) => r.month))].sort();
    const names = [...new Set(rows.map((r) => r.region))].sort();
    const map = {};
    rows.forEach((r) => { (map[r.region] = map[r.region] || {})[r.month] = r; });
    const val = (name, i, key) => {
      const m = months[i];
      if (name === "ALL") {
        const v = names.map((n) => map[n]?.[m]?.[key]).filter((x) => x != null);
        return v.length ? avg(v) : null;
      }
      return map[name]?.[m]?.[key] ?? null;
    };
    const maxAll = rows.length ? Math.max(...rows.map((r) => r.rate)) : 40;
    return { months, names, val, maxAll };
  }, [rows]);

  const { months, names, val, maxAll } = model;
  const last = months.length - 1;

  useEffect(() => {
    if (!months.length || inited.current) return;
    inited.current = true;
    const k = months.indexOf("2020-04");
    setMi(k >= 0 ? k : last);
  }, [months, last]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setMi((p) => Math.min(p + 1, last)), 700);
    return () => clearInterval(id);
  }, [playing, last]);
  useEffect(() => { if (playing && mi >= last) setPlaying(false); }, [mi, playing, last]);

  const seriesOf = (n) => months.map((_, i) => val(n, i, "rate"));
  const preOf = (series) => {
    let idx = months.map((m, i) => (m < "2020-03" ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) idx = months.map((_, i) => i).slice(0, Math.max(1, Math.floor(months.length / 2)));
    return avg(nums(idx.map((i) => series[i])));
  };
  const scoreOf = (n) => {
    const sr = seriesOf(n), v = nums(sr);
    if (!v.length) return null;
    const p = preOf(sr), peak = Math.max(...v), lastv = v[v.length - 1];
    return Math.max(0, Math.min(100, Math.round(100 - ((peak - p) * 0.8 + Math.max(0, lastv - p) * 2.5))));
  };

  const s = seriesOf(st);
  const pre = preOf(s);
  const cur = s[mi];
  const prev = mi > 0 ? s[mi - 1] : null;
  const change = cur != null && prev != null ? cur - prev : 0;
  const peakSoFar = nums(s.slice(0, mi + 1)).length ? Math.max(...nums(s.slice(0, mi + 1))) : null;
  const lfprNow = val(st, mi, "lfpr");
  const ranked = names
    .map((n) => [n, val(n, mi, "rate")])
    .filter((x) => x[1] != null)
    .sort((a, b) => b[1] - a[1]);
  const stName = st === "ALL" ? "All India" : st;

  const trendData = months.map((m, i) => ({ month: m, rate: s[i] }));
  if (fc && last >= 0 && s[last] != null) {
    trendData[last].fc = s[last];
    for (let i = 1; i <= 6; i++) {
      trendData.push({ month: addMonths(months[last], i), fc: r1(s[last] + (pre - s[last]) * (1 - Math.pow(0.7, i))) });
    }
  }
  const top10 = names
    .map((n) => ({ region: n, avg_rate: r1(avg(nums(seriesOf(n)))) }))
    .sort((a, b) => b.avg_rate - a.avg_rate)
    .slice(0, 10);

  const extras = names.filter((n) => !LAYOUT[n]);
  const pos = (n) => LAYOUT[n] || [extras.indexOf(n), 8];

  const cmpList = cmp.filter((c) => names.includes(c));
  const cmpData = months.map((m, i) => {
    const o = { month: m };
    cmpList.forEach((c) => { o[c] = val(c, i, "rate"); });
    return o;
  });

  const scores = names.map((n) => [n, scoreOf(n)]).filter((x) => x[1] != null).sort((a, b) => b[1] - a[1]);
  const alerts = names
    .map((n) => [n, mi > 0 && val(n, mi, "rate") != null && val(n, mi - 1, "rate") != null ? val(n, mi, "rate") - val(n, mi - 1, "rate") : 0])
    .filter((a) => a[1] >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // simulator, calibrated on the selected state's real lockdown spike
  const sNums = nums(s);
  const calibRise = sNums.length ? Math.max(0, Math.max(...sNums) - pre) : 0;
  const simRise = (calibRise / 8) * weeks * (1 - 0.5 * support / 100);
  const simRec = Math.round(2 + weeks * 0.4 * (1 - 0.4 * support / 100));
  const simUp = Math.max(1, Math.ceil(weeks / 4));
  const simData = Array.from({ length: 15 }, (_, t) => ({
    label: t ? "M" + t : "Now",
    rate: r1(t <= simUp ? pre + (simRise * t) / simUp : pre + simRise * Math.pow(0.5, (t - simUp) / (simRec / 3))),
  }));

  async function ask(q) {
    const l = q.toLowerCase();
    let a = "", sql = "";
    const pk = names
      .map((n) => { const sr = seriesOf(n), v = nums(sr); return v.length ? [n, Math.max(...v), months[sr.indexOf(Math.max(...v))]] : null; })
      .filter(Boolean)
      .sort((x, y) => y[1] - x[1]);
    if (/recover|resilien|fastest/.test(l) && scores.length) {
      a = `${scores[0][0]} recovered best (score ${scores[0][1]}). Weakest: ${scores[scores.length - 1][0]} (${scores[scores.length - 1][1]}).`;
      sql = "SELECT region, MAX(unemployment_rate) AS peak,\n       AVG(unemployment_rate) AS avg_rate\nFROM unemployment\nGROUP BY region;  -- score computed from these";
    } else if (/low|least/.test(l) && pk.length) {
      const x = pk[pk.length - 1];
      a = `${x[0]} had the lowest peak rate: ${r1(x[1])}% in ${ml(x[2])}.`;
      sql = "SELECT region, MAX(unemployment_rate) AS peak\nFROM unemployment\nGROUP BY region\nORDER BY peak ASC LIMIT 1;";
    } else if (/high|worst|most/.test(l) && pk.length) {
      const x = pk[0];
      a = `${x[0]} peaked highest at ${r1(x[1])}% in ${ml(x[2])}.`;
      sql = "SELECT region, MAX(unemployment_rate) AS peak\nFROM unemployment\nGROUP BY region\nORDER BY peak DESC LIMIT 1;";
    } else if (/rural|urban/.test(l)) {
      try {
        const [r, u] = await Promise.all([
          fetch(`${API}/kpis?area=Rural`).then((x) => x.json()),
          fetch(`${API}/kpis?area=Urban`).then((x) => x.json()),
        ]);
        a = `Urban averaged ${r1(u.avg_rate)}% vs rural ${r1(r.avg_rate)}%, a gap of ${r1(u.avg_rate - r.avg_rate)} pts.`;
      } catch { a = "Backend se data nahi aa pa raha."; }
      sql = "SELECT area, AVG(unemployment_rate)\nFROM unemployment\nGROUP BY area;";
    } else if (/april|lockdown|spike|2020/.test(l)) {
      const all = seriesOf("ALL"), i3 = months.indexOf("2020-03"), i4 = months.indexOf("2020-04"), i5 = months.indexOf("2020-05");
      if (i3 >= 0 && i4 >= 0) {
        a = `National rate went from ${pct(all[i3])} in Mar 2020 to ${pct(all[i4])} in Apr (+${r1(all[i4] - all[i3])} pts)` + (i5 >= 0 ? `, and ${pct(all[i5])} in May.` : ".");
      } else a = "Is data me Mar/Apr 2020 nahi mila.";
      sql = "SELECT substr(date,1,7) AS month, AVG(unemployment_rate)\nFROM unemployment\nWHERE date >= '2020-03' AND date < '2020-06'\nGROUP BY month;";
    } else if (/average|avg|mean/.test(l)) {
      a = `National average is ${pct(avg(nums(seriesOf("ALL"))))} across ${ml(months[0])} to ${ml(months[last])}.`;
      sql = "SELECT AVG(unemployment_rate)\nFROM unemployment;";
    } else {
      a = "Main recovery, highest/lowest state, rural vs urban, lockdown spike aur average pe jawab de sakta hu. Upar ke chips try karo.";
    }
    setQa({ q, a, sql });
  }

  const showTime = ["dash", "map", "ins"].includes(tab);
  const latest = plfs[plfs.length - 1] || {};

  return (
    <div className="wrap">
      <h1>India Unemployment Analytics</h1>
      <p className="sub">CMIE data (2019-20) and PLFS bulletins (2025-26)</p>
      {error && <p className="err">{error}</p>}

      <div className="tabs">
        {TABS.map(([k, t]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>

      {tab !== "now" && (
        <div className="filters">
          <select value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="ALL">All India</option>
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Rural + Urban</option>
            <option>Rural</option>
            <option>Urban</option>
          </select>
        </div>
      )}

      {tab !== "now" && loading && <p className="sub">Loading data... (Render free plan pe pehli baar 30-50 sec lag sakte hain)</p>}

      {showTime && months.length > 0 && (
        <div className="card u-time">
          <button className="u-play" onClick={() => { if (!playing && mi >= last) setMi(0); setPlaying(!playing); }}>
            {playing ? "Pause" : "Play"}
          </button>
          <input type="range" min={0} max={Math.max(0, last)} value={mi}
            onChange={(e) => { setPlaying(false); setMi(+e.target.value); }} />
          <b>{ml(months[mi])}</b>
        </div>
      )}

      {tab === "dash" && (
        <>
          <div className="kpis">
            <Card label="Rate this month" value={pct(cur)} />
            <Card label="Change vs last month" value={(change >= 0 ? "+" : "") + r1(change) + " pts"} hot={change > 3} />
            <Card label="Peak so far" value={pct(peakSoFar)} hot />
            <Card label="Labour participation" value={pct(lfprNow)} />
          </div>
          <div className="grid">
            <div className="card">
              <h3>Trend: {stName}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={ml} />
                  <YAxis unit="%" />
                  <Tooltip labelFormatter={ml} />
                  <Line type="monotone" dataKey="rate" stroke="#0f766e" strokeWidth={2.5} dot={false} connectNulls />
                  {fc && <Line type="monotone" dataKey="fc" stroke="#d9482b" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />}
                  {cur != null && <ReferenceDot x={months[mi]} y={cur} r={6} fill="#d9482b" stroke="#fff" strokeWidth={2} />}
                </LineChart>
              </ResponsiveContainer>
              <label className="u-check">
                <input type="checkbox" checked={fc} onChange={(e) => setFc(e.target.checked)} /> Show 6-month forecast (illustrative)
              </label>
            </div>
            <div className="card">
              <h3>Auto insights</h3>
              <p className="sub">Slider ke saath badalta hai</p>
              <ul className="u-list">
                <li><b>{stName}</b> is at {pct(cur)} in {ml(months[mi])}, {pre ? r1(cur / pre) : "-"}x its pre-lockdown average ({pct(pre)}).</li>
                {ranked.length > 0 && (
                  <li>Highest this month: <b>{ranked[0][0]}</b> at {pct(ranked[0][1])}. Lowest: <b>{ranked[ranked.length - 1][0]}</b> at {pct(ranked[ranked.length - 1][1])}.</li>
                )}
                <li>{mi >= last ? "Latest month in the data." : change > 3 ? "Sharp jump from last month." : "Rates are fairly stable vs last month."}</li>
              </ul>
            </div>
          </div>
          <div className="card">
            <h3>Top 10 states by average rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="region" width={110} interval={0} />
                <Tooltip />
                <Bar dataKey="avg_rate" fill="#d9482b" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === "map" && (
        <div className="grid">
          <div className="card">
            <h3>State map</h3>
            <p className="sub">Tap a state. Darker means higher unemployment. ({ml(months[mi])})</p>
            <div className="u-map">
              {names.map((n) => {
                const v = val(n, mi, "rate");
                const p = v == null ? 0 : Math.round(Math.min(100, Math.max(8, (v / maxAll) * 100)));
                const [c, r] = pos(n);
                return (
                  <button key={n} title={n} onClick={() => setSt(n)}
                    className={"u-tile" + (n === st ? " sel" : "")}
                    style={{ gridColumn: c + 1, gridRow: r, background: `color-mix(in srgb, #0f766e ${p}%, #ffffff)`, color: p > 55 ? "#fff" : "#14201f" }}>
                    <b>{SHORT[n] || n.slice(0, 2).toUpperCase()}</b>
                    <span>{v == null ? "-" : r1(v)}</span>
                  </button>
                );
              })}
            </div>
            <div className="u-leg"><span>Low</span><i /><span>High</span></div>
          </div>
          <div className="card">
            <h3>Top 5 highest</h3>
            <p className="sub">{ml(months[mi])}</p>
            {ranked.slice(0, 5).map(([n, v]) => (
              <div className="u-rk" key={n}>
                <span>{n}</span>
                <i style={{ width: Math.round((v / maxAll) * 100) + "%" }} />
                <span>{pct(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "cmp" && (
        <div className="card">
          <h3>Compare states</h3>
          <p className="sub">Max 4 states. Chip pe click karke hatao.</p>
          <div className="u-chips">
            {cmpList.map((c, k) => (
              <button key={c} className="u-chip on" onClick={() => cmpList.length > 1 && setCmp(cmpList.filter((x) => x !== c))}>
                <s style={{ background: PAL[k] }} />{c} ×
              </button>
            ))}
            {cmpList.length < 4 && (
              <select value="" onChange={(e) => e.target.value && setCmp([...cmpList, e.target.value])}>
                <option value="">+ Add state</option>
                {names.filter((n) => !cmpList.includes(n)).map((n) => <option key={n}>{n}</option>)}
              </select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={cmpData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={ml} />
              <YAxis unit="%" />
              <Tooltip labelFormatter={ml} />
              <Legend />
              {cmpList.map((c, k) => (
                <Line key={c} type="monotone" dataKey={c} stroke={PAL[k]} strokeWidth={2.5} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "ins" && (
        <div className="grid">
          <div className="card">
            <h3>Resilience score</h3>
            <p className="sub">Lockdown shock ko kaun si state kitna absorb aur recover kar payi</p>
            {scores.map(([n, v]) => {
              const t = tier(v);
              return (
                <div className="u-rr" key={n}>
                  <span>{n}</span>
                  <span className="u-bg"><i style={{ width: v + "%", background: t[1] }} /></span>
                  <b>{v}</b>
                  <em style={{ color: t[1] }}>{t[0]}</em>
                </div>
              );
            })}
            <p className="u-note">Score = 100 - (0.8 x spike + 2.5 x unrecovered gap), pre-lockdown average ke against. 75+ strong, 55+ moderate, uske neeche fragile.</p>
          </div>
          <div className="card">
            <h3>Early warning flags</h3>
            <p className="sub">Jump vs last month · {ml(months[mi])}</p>
            {alerts.length ? alerts.map(([n, d]) => {
              const lv = d >= 15 ? ["High", "#d9482b"] : d >= 8 ? ["Medium", "#c98500"] : ["Watch", "#5f6b69"];
              return (
                <div className="u-rr" key={n}>
                  <span>{n}</span>
                  <b style={{ flex: 1 }}>+{r1(d)} pts</b>
                  <em style={{ color: lv[1] }}>{lv[0]}</em>
                </div>
              );
            }) : <p className="sub">Is mahine koi unusual jump nahi. Slider ko Apr 2020 pe le jao.</p>}
            <p className="u-note">Abhi simple 3-point jump threshold hai. Baad me Isolation Forest laga sakte hain.</p>
          </div>
        </div>
      )}

      {tab === "ask" && (
        <div className="card">
          <h3>Ask the data</h3>
          <p className="sub">Sawal chuno ya likho. Neeche SQL bhi dikhegi.</p>
          <div className="u-chips">
            {QS.map((q) => <button key={q} className="u-chip" onClick={() => ask(q)}>{q}</button>)}
          </div>
          <div className="u-ask">
            <input value={qtext} placeholder="Which state recovered fastest?"
              onChange={(e) => setQtext(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && qtext.trim() && ask(qtext.trim())} />
            <button onClick={() => qtext.trim() && ask(qtext.trim())}>Ask</button>
          </div>
          {qa ? (
            <div>
              <p className="sub"><b>You:</b> {qa.q}</p>
              <p>{qa.a}</p>
              {qa.sql && <pre>{qa.sql}</pre>}
            </div>
          ) : <p className="sub">Upar koi sawal chuno.</p>}
          <p className="u-note">Keyword matching se chalta hai. Asli LLM ke liye paid API key lagegi.</p>
        </div>
      )}

      {tab === "sim" && (
        <div className="grid">
          <div className="card">
            <h3>Shock simulator</h3>
            <p className="sub">{stName} · upar se state badlo</p>
            <div className="u-check">Lockdown length: <b>{weeks}</b> weeks</div>
            <input type="range" min={0} max={12} value={weeks} onChange={(e) => setWeeks(+e.target.value)} style={{ width: "100%" }} />
            <div className="u-check">Government support: <b>{support}</b>%</div>
            <input type="range" min={0} max={100} value={support} onChange={(e) => setSupport(+e.target.value)} style={{ width: "100%" }} />
            <div className="kpis" style={{ marginTop: 14 }}>
              <Card label="Predicted peak" value={pct(pre + simRise)} hot />
              <Card label="Rise vs normal" value={"+" + r1(simRise) + " pts"} />
              <Card label="Estimated recovery" value={simRec + " months"} />
            </div>
          </div>
          <div className="card">
            <h3>Projected path</h3>
            <p className="sub">Shock shuru hone ke mahine baad</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={simData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#d9482b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="u-note">Exploratory model, 2019-20 ke real spike pe calibrated. Forecast nahi hai.</p>
          </div>
        </div>
      )}

      {tab === "now" && (
        <>
          <div className="kpis">
            <Card label={`Overall (${latest.month || "-"})`} value={pct(latest.overall)} />
            <Card label="Rural" value={pct(latest.rural)} />
            <Card label="Urban" value={pct(latest.urban)} hot />
            <Card label="Participation" value={pct(latest.lfpr)} />
          </div>
          <div className="grid">
            <div className="card">
              <h3>Monthly unemployment rate (PLFS)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={plfs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis unit="%" domain={["auto", "auto"]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" stroke={PAL[0]} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="urban" stroke={PAL[1]} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="rural" stroke={PAL[2]} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>Labour force participation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={plfs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis unit="%" domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="lfpr" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="u-note">Source: PLFS monthly bulletins, MoSPI. CMIE 2019-20 data se comparable nahi hai (survey method alag hai).</p>
        </>
      )}
    </div>
  );
}