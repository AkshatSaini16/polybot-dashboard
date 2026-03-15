"use client";

import { useEffect, useState } from "react";
import type { Analytics } from "@/lib/types";
import { formatUsdt, formatInr, usdtToInr, formatBoth } from "@/lib/currency";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/data/analytics.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("No analytics data yet."));
  }, []);

  if (error) return <div className="text-center py-20 text-gray-500">{error}</div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  const pnlColor = data.total_pnl >= 0 ? "text-emerald-400" : "text-red-400";
  const alphaColor = data.monthly_alpha_est >= 15 ? "text-emerald-400" : "text-yellow-400";
  const gateStatus = data.monthly_alpha_est >= 15 ? "PASSED" : "NOT MET";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total P&L"
          value={formatUsdt(data.total_pnl)}
          sub={formatInr(usdtToInr(data.total_pnl))}
        />
        <StatCard label="Win Rate" value={`${(data.win_rate * 100).toFixed(0)}%`} sub={`${data.total_trades} trades`} />
        <StatCard label="Best Trade" value={formatUsdt(data.best_trade)} />
        <StatCard label="Worst Trade" value={formatUsdt(data.worst_trade)} />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Alpha Est</p>
          <p className={`text-xl font-bold mt-1 ${alphaColor}`}>{data.monthly_alpha_est.toFixed(1)}%</p>
          <p className={`text-sm ${alphaColor}`}>Phase 3 Gate: {gateStatus}</p>
        </div>
      </div>

      {/* Signal execution */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Signals Generated"
          value={String(data.signals_generated)}
          sub={`${data.signals_executed} executed (${data.signals_generated > 0 ? ((data.signals_executed / data.signals_generated) * 100).toFixed(0) : 0}%)`}
        />
        <StatCard
          label="Projection (4 weeks)"
          value={formatBoth(data.total_pnl * 4)}
          sub="Based on current weekly P&L"
        />
      </div>

      {/* P&L Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="font-medium mb-4">Cumulative P&L Over Time</h3>
        {data.daily_pnl.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No P&L data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.daily_pnl}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
                labelStyle={{ color: "#9ca3af" }}
                formatter={(value: number) => [formatUsdt(value), "Cumulative P&L"]}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="font-medium mb-4">P&L by Category</h3>
        {data.category_breakdown.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No category data yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.category_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
                  formatter={(value: number) => [formatUsdt(value), "P&L"]}
                />
                <Bar dataKey="pnl">
                  {data.category_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "#34d399" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {data.category_breakdown.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{cat.category}</span>
                  <div className="flex gap-4">
                    <span className={cat.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatUsdt(cat.pnl)}
                    </span>
                    <span className="text-gray-500">{cat.trades} trades</span>
                    <span className="text-gray-500">{(cat.win_rate * 100).toFixed(0)}% WR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
