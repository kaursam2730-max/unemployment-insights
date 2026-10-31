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