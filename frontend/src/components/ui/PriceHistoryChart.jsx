import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import api from '../../services/api.js';
import { LineSkeleton } from './LoadingSkeleton.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export default function PriceHistoryChart({ productId, days = 90 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const gridColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
  const tooltipBg = isDark ? 'rgba(22,22,24,0.96)' : 'rgba(255,255,255,0.98)';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const labelColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const accent = isDark ? '#2997ff' : '#0071e3';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/products/${productId}/price-history?days=${days}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => !cancelled && setError('Could not load price history'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, days]);

  if (loading)
    return (
      <div className="glass-card p-6">
        <LineSkeleton height={200} />
      </div>
    );
  if (error || !data || data.history.length === 0)
    return (
      <div className="glass-card p-6 text-sm text-muted">
        No price history available yet.
      </div>
    );

  const advice =
    data.current <= data.min * 1.05
      ? { tone: 'text-green-400', text: 'Near all-time low — great time to buy!' }
      : data.current >= data.max * 0.95
        ? { tone: 'text-orange-400', text: 'Near all-time high — consider waiting' }
        : { tone: 'text-blue-300', text: 'Mid range — reasonable price' };

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold gradient-text">Price History</h3>
          <p className="text-xs text-muted">Last {days} days</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <Stat label="Low" value={formatINR(data.min)} className="text-green-400" />
          <Stat label="Avg" value={formatINR(data.avg)} />
          <Stat label="High" value={formatINR(data.max)} className="text-orange-400" />
        </div>
      </div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <AreaChart data={data.history} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke={axisColor}
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(d) => d.slice(5)}
              minTickGap={32}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 12,
                color: isDark ? '#f5f5f7' : '#1d1d1f',
                backdropFilter: 'blur(12px)',
              }}
              labelStyle={{ color: labelColor }}
              formatter={(v) => [formatINR(v), 'Price']}
            />
            <ReferenceLine
              y={data.avg}
              stroke={gridColor}
              strokeDasharray="4 4"
              label={{ value: 'avg', fill: labelColor, fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accent}
              strokeWidth={2}
              fill="url(#priceGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={`text-sm ${advice.tone}`}>💡 {advice.text}</div>
    </div>
  );
}

function Stat({ label, value, className = '' }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
      <span className={`text-sm font-medium ${className}`}>{value}</span>
    </div>
  );
}
