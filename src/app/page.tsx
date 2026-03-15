"use client";

import { useEffect, useState } from "react";
import type { Portfolio, Meta } from "@/lib/types";
import { formatUsdt, formatInr, usdtToInr } from "@/lib/currency";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function RegimeBadge({ regime }: { regime: string }) {
  const colors: Record<string, string> = {
    bull: "bg-green-900 text-green-300",
    bear: "bg-red-900 text-red-300",
    sideways: "bg-yellow-900 text-yellow-300",
    high_vol: "bg-purple-900 text-purple-300",
    election: "bg-blue-900 text-blue-300",
    unknown: "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[regime] || colors.unknown}`}>
      {regime}
    </span>
  );
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/data/portfolio.json").then((r) => r.json()),
      fetch("/data/meta.json").then((r) => r.json()),
    ])
      .then(([p, m]) => { setPortfolio(p); setMeta(m); })
      .catch(() => setError("No data yet. Run: python scripts/export_dashboard_data.py"));
  }, []);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">{error}</p>
      </div>
    );
  }
  if (!portfolio || !meta) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  const pnlColor = portfolio.total_unrealized_pnl >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        <div className="flex items-center gap-3">
          <RegimeBadge regime={portfolio.regime} />
          <span className="text-xs text-gray-500">
            Updated: {new Date(portfolio.last_updated).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Balance (USDT)">
          <p className="text-2xl font-bold">{formatUsdt(portfolio.balance_usdt)}</p>
          <p className="text-sm text-gray-500">{formatInr(portfolio.balance_inr)}</p>
        </Card>
        <Card title="Active Capital">
          <p className="text-2xl font-bold">{formatUsdt(portfolio.active_capital_usdt)}</p>
          <p className="text-sm text-gray-500">Reserve: {formatUsdt(portfolio.reserve_usdt)}</p>
        </Card>
        <Card title="Unrealized P&L">
          <p className={`text-2xl font-bold ${pnlColor}`}>
            {formatUsdt(portfolio.total_unrealized_pnl)}
          </p>
          <p className={`text-sm ${pnlColor}`}>
            {formatInr(usdtToInr(portfolio.total_unrealized_pnl))}
          </p>
        </Card>
        <Card title="Open Positions">
          <p className="text-2xl font-bold">{portfolio.positions.length}</p>
          <p className="text-sm text-gray-500">Max: 8</p>
        </Card>
      </div>

      {/* Open Positions Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="font-medium">Open Positions</h3>
        </div>
        {portfolio.positions.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500">No open positions</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-500">Market</th>
                <th className="px-4 py-2 text-left text-gray-500">Side</th>
                <th className="px-4 py-2 text-right text-gray-500">Entry</th>
                <th className="px-4 py-2 text-right text-gray-500">Current</th>
                <th className="px-4 py-2 text-right text-gray-500">Size</th>
                <th className="px-4 py-2 text-right text-gray-500">P&L</th>
                <th className="px-4 py-2 text-left text-gray-500">Category</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((pos, i) => (
                <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2 font-mono text-xs">{pos.condition_id.slice(0, 16)}...</td>
                  <td className="px-4 py-2">
                    <span className={pos.side === "BUY" ? "text-emerald-400" : "text-red-400"}>
                      {pos.side}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{pos.entry_price.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right">{pos.current_price.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right">{formatUsdt(pos.size_usdt)}</td>
                  <td className={`px-4 py-2 text-right ${pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatUsdt(pos.pnl)} ({pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(1)}%)
                  </td>
                  <td className="px-4 py-2 text-gray-400">{pos.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
