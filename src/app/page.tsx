"use client";

import { useEffect, useState } from "react";
import type { Portfolio, Position, Meta, Investment } from "@/lib/types";
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

function QueueBadge({ queue }: { queue?: string }) {
  if (queue === "stale") {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-900/60 text-yellow-400">STALE</span>;
  }
  return null;
}

function PositionTable({ positions, title, subtitle }: { positions: Position[]; title: string; subtitle?: string }) {
  if (positions.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="font-medium">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs text-gray-500">{positions.length} position{positions.length !== 1 ? "s" : ""}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-800/50">
          <tr>
            <th className="px-4 py-2 text-left text-gray-500">What We Bet On</th>
            <th className="px-4 py-2 text-right text-gray-500">Odds</th>
            <th className="px-4 py-2 text-right text-gray-500">Bet (INR)</th>
            <th className="px-4 py-2 text-right text-gray-500">Potential Win</th>
            <th className="px-4 py-2 text-right text-gray-500">P&L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => {
            const shares = pos.entry_price > 0 ? pos.size_usdt / pos.entry_price : 0;
            const potentialWin = (shares * 1.0 - pos.size_usdt) * 83.5;
            return (
              <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2 max-w-[300px]">
                  <div className="flex items-center gap-1.5">
                    {pos.polymarket_url ? (
                      <a href={pos.polymarket_url} target="_blank" rel="noopener noreferrer"
                         className="text-blue-400 hover:text-blue-300 hover:underline text-sm">
                        {pos.bet_description || pos.question || pos.condition_id.slice(0, 16) + "..."}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-300">
                        {pos.bet_description || pos.question || pos.condition_id.slice(0, 16) + "..."}
                      </span>
                    )}
                    <QueueBadge queue={pos.queue} />
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Copied from {pos.source_wallet}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <span className="text-white">{Math.round(pos.entry_price * 100)}%</span>
                </td>
                <td className="px-4 py-2 text-right text-yellow-300">
                  {formatInr(pos.size_inr || pos.size_usdt * 83.5)}
                </td>
                <td className="px-4 py-2 text-right text-emerald-400">
                  +{formatInr(potentialWin > 0 ? potentialWin : 0)}
                </td>
                <td className={`px-4 py-2 text-right ${pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pos.pnl !== 0 ? (
                    <>{formatInr((pos.pnl_inr || pos.pnl * 83.5))} ({pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(1)}%)</>
                  ) : (
                    <span className="text-gray-500">pending</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  const q = portfolio.queue;
  const activePositions = portfolio.positions.filter((p) => p.queue !== "stale");
  const stalePositions = portfolio.positions.filter((p) => p.queue === "stale");

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

      {/* Invested + Balance overview */}
      {meta.investments && meta.investments.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invested</h3>
            <span className="text-2xl font-bold text-white">
              {formatInr(meta.total_invested_inr ?? 0)}
              <span className="text-sm text-gray-500 ml-2">({formatUsdt(meta.total_invested_usdt ?? 0)})</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meta.investments.map((inv: Investment, i: number) => (
              <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
                <div>
                  <span className="text-sm text-gray-300">{inv.label}</span>
                  <span className="text-xs text-gray-600 ml-2">{inv.date}</span>
                </div>
                <span className="text-sm font-medium text-emerald-400">+{formatInr(inv.amount_inr)}</span>
              </div>
            ))}
          </div>
          {/* Return on investment */}
          {(() => {
            const totalInvested = meta.total_invested_usdt ?? meta.starting_capital_usdt;
            const currentValue = portfolio.balance_usdt;
            const roi = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
            const roiColor = roi >= 0 ? "text-emerald-400" : "text-red-400";
            return (
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500">Current Value vs Invested</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-white">{formatInr(portfolio.balance_inr)}</span>
                  <span className={`text-sm ml-2 ${roiColor}`}>
                    ({roi >= 0 ? "+" : ""}{roi.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Balance">
          <p className="text-2xl font-bold">{formatInr(portfolio.balance_inr)}</p>
          <p className="text-sm text-gray-500">{formatUsdt(portfolio.balance_usdt)}</p>
        </Card>
        <Card title="Unrealized P&L">
          <p className={`text-2xl font-bold ${pnlColor}`}>
            {formatInr(usdtToInr(portfolio.total_unrealized_pnl))}
          </p>
          <p className={`text-sm ${pnlColor}`}>
            {formatUsdt(portfolio.total_unrealized_pnl)}
          </p>
        </Card>
        <Card title="Active Slots">
          <p className="text-2xl font-bold">
            {q ? q.active_slots_used : activePositions.length}
            <span className="text-base text-gray-500">/{q?.active_slots_max ?? 12}</span>
          </p>
          <p className="text-sm text-gray-500">
            Free: {formatInr(usdtToInr(q?.free_capital_usdt ?? 0))}
          </p>
        </Card>
        <Card title="Stale Queue">
          <p className="text-2xl font-bold text-yellow-400">
            {q?.stale_count ?? stalePositions.length}
          </p>
          <p className="text-sm text-gray-500">
            Locked: {formatInr(usdtToInr(q?.stale_locked_usdt ?? 0))}
          </p>
        </Card>
      </div>

      {/* Active Positions */}
      <PositionTable
        positions={activePositions}
        title="Active Positions"
        subtitle={`Trades < 48h old | ${q ? q.active_slots_used : activePositions.length}/${q?.active_slots_max ?? 12} slots used`}
      />

      {/* Stale Positions */}
      <PositionTable
        positions={stalePositions}
        title="Stale Positions"
        subtitle={`Trades > 48h old | Capital locked: ${formatUsdt(q?.stale_locked_usdt ?? 0)} (max ${((q?.stale_capital_cap_pct ?? 0.25) * 100).toFixed(0)}% of active capital)`}
      />

      {/* Show empty state if no positions at all */}
      {portfolio.positions.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <p className="px-5 py-8 text-center text-gray-500">No open positions</p>
        </div>
      )}
    </div>
  );
}
