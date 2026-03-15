"use client";

import { useEffect, useState } from "react";
import type { Trade } from "@/lib/types";
import { formatUsdt, formatInr, usdtToInr } from "@/lib/currency";

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/data/trades.json")
      .then((r) => r.json())
      .then((data) => setTrades(data.trades || []))
      .catch(() => setError("No trade data yet. Run the paper trading simulator first."));
  }, []);

  const filtered = filter === "all" ? trades : trades.filter((t) => t.category === filter);
  const categories = Array.from(new Set(trades.map((t) => t.category)));

  const totalPnl = filtered.reduce((sum, t) => sum + t.pnl, 0);
  const wins = filtered.filter((t) => t.pnl > 0).length;
  const losses = filtered.filter((t) => t.pnl <= 0 && t.status === "CLOSED").length;

  if (error) {
    return <div className="text-center py-20 text-gray-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trade Log</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm rounded px-3 py-1.5 text-gray-300"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-6 text-sm">
        <span className="text-gray-500">
          Showing: <span className="text-white">{filtered.length}</span> trades
        </span>
        <span className="text-gray-500">
          P&L: <span className={totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
            {formatUsdt(totalPnl)}
          </span>
        </span>
        <span className="text-gray-500">
          W/L: <span className="text-emerald-400">{wins}</span>
          /<span className="text-red-400">{losses}</span>
        </span>
      </div>

      {/* Trades table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500">No trades yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-500">Time</th>
                <th className="px-4 py-2 text-left text-gray-500">Market</th>
                <th className="px-4 py-2 text-left text-gray-500">Side</th>
                <th className="px-4 py-2 text-left text-gray-500">Tier</th>
                <th className="px-4 py-2 text-right text-gray-500">Price</th>
                <th className="px-4 py-2 text-right text-gray-500">Size (USDT)</th>
                <th className="px-4 py-2 text-right text-gray-500">Size (INR)</th>
                <th className="px-4 py-2 text-right text-gray-500">P&L</th>
                <th className="px-4 py-2 text-left text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-gray-500">Category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade, i) => (
                <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2 text-xs text-gray-400">
                    {new Date(trade.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {trade.condition_id.slice(0, 16)}...
                  </td>
                  <td className="px-4 py-2">
                    <span className={trade.side === "BUY" ? "text-emerald-400" : "text-red-400"}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      trade.tier === 1 ? "bg-emerald-900 text-emerald-300" : "bg-yellow-900 text-yellow-300"
                    }`}>
                      T{trade.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{trade.price.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right">{formatUsdt(trade.size_usdt)}</td>
                  <td className="px-4 py-2 text-right text-gray-400">
                    {formatInr(usdtToInr(trade.size_usdt))}
                  </td>
                  <td className={`px-4 py-2 text-right ${
                    trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {trade.status === "CLOSED" ? formatUsdt(trade.pnl) : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs ${
                      trade.status === "OPEN" ? "text-blue-400" : "text-gray-400"
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400">{trade.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
