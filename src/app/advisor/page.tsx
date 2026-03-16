"use client";

import { useEffect, useState } from "react";
import type { Meta } from "@/lib/types";
import { formatInr } from "@/lib/currency";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    high: "bg-emerald-900 text-emerald-300",
    medium: "bg-yellow-900 text-yellow-300",
    low: "bg-red-900 text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[confidence] || "bg-gray-800 text-gray-400"}`}>
      {confidence}
    </span>
  );
}

function RegimeBadge({ regime }: { regime: string }) {
  const colors: Record<string, string> = {
    bull: "bg-green-900 text-green-300",
    bear: "bg-red-900 text-red-300",
    sideways: "bg-yellow-900 text-yellow-300",
    high_vol: "bg-purple-900 text-purple-300",
    unknown: "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[regime] || colors.unknown}`}>
      {regime}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    approved: "bg-emerald-900 text-emerald-300",
    rejected: "bg-red-900 text-red-300",
    pending: "bg-yellow-900 text-yellow-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-800 text-gray-400"}`}>
      {status}
    </span>
  );
}

export default function AdvisorPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [actionResult, setActionResult] = useState<string>("");

  const refreshData = () => {
    fetch("/data/meta.json")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setError("No advisor data yet."));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleProposal = async (id: number, action: "approve" | "reject") => {
    setActionInProgress(id);
    setActionResult("");
    try {
      const resp = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await resp.json();
      if (data.success) {
        setActionResult(`${action === "approve" ? "Approved" : "Rejected"} — changes pushed to site`);
        // Refresh data after a short delay to let the export finish
        setTimeout(refreshData, 2000);
      } else {
        setActionResult(`Error: ${data.error}`);
      }
    } catch (e) {
      setActionResult(`Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  if (error) return <div className="text-center py-20 text-gray-500">{error}</div>;
  if (!meta) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  const advisor = meta.ai_advisor;
  const params = meta.soft_params;
  const skipReasons = meta.skip_reasons || [];
  const proposals = meta.pending_proposals || [];
  const actionHistory = meta.action_history || [];
  const walletHealth = meta.wallet_health || [];

  // How long ago was last signal
  const lastSignalAgo = meta.last_signal_at
    ? Math.round((Date.now() - new Date(meta.last_signal_at + "Z").getTime()) / 60000)
    : null;

  // How long ago was last AI analysis
  const lastAnalysisAgo = advisor?.timestamp
    ? Math.round((Date.now() - new Date(advisor.timestamp + "Z").getTime()) / 60000)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Advisor</h2>
        <div className="flex items-center gap-4">
          {lastAnalysisAgo !== null && (
            <span className="text-xs text-gray-500">
              Last AI analysis: {lastAnalysisAgo < 60 ? `${lastAnalysisAgo}m ago` : `${(lastAnalysisAgo / 60).toFixed(1)}h ago`}
            </span>
          )}
          <span className="text-xs text-gray-500">
            Last export: {new Date(meta.exported_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bot Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SectionCard title="Bot Status">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${meta.bot_running ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className={`text-lg font-bold ${meta.bot_running ? "text-emerald-400" : "text-red-400"}`}>
              {meta.bot_running ? "Running" : "Stopped"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Paper Trading{!meta.bot_running && " — check logs"}
          </p>
        </SectionCard>

        <SectionCard title="Regime">
          <div className="flex items-center gap-2">
            <RegimeBadge regime={meta.current_regime} />
            {advisor && <ConfidenceBadge confidence={advisor.confidence} />}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Next review: {advisor?.next_review || "?"}
          </p>
        </SectionCard>

        <SectionCard title="Last Signal">
          <p className="text-lg font-bold">
            {lastSignalAgo !== null
              ? (lastSignalAgo < 60 ? `${lastSignalAgo}m ago` : `${(lastSignalAgo / 60).toFixed(1)}h ago`)
              : "No signals"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {meta.last_signal_at ? new Date(meta.last_signal_at + "Z").toLocaleString() : "-"}
          </p>
        </SectionCard>

        <SectionCard title="Capital">
          <p className="text-lg font-bold">{formatInr(meta.starting_capital_inr)}</p>
          <p className="text-xs text-gray-500 mt-1">${meta.starting_capital_usdt} USDT</p>
        </SectionCard>
      </div>

      {/* Pending Proposals (Tier 3 — needs approval) */}
      {proposals.length > 0 && (
        <SectionCard title="Pending Proposals (Needs Your Approval)">
          <div className="space-y-3">
            {proposals.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-yellow-300">
                      {p.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-500">Tier {p.tier}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.label || p.wallet || p.param} — {p.reason}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {actionInProgress === i ? (
                    <span className="text-xs text-gray-400 animate-pulse">Processing...</span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleProposal(i, "approve")}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleProposal(i, "reject")}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {actionResult && (
            <div className={`mt-3 px-3 py-2 rounded text-sm ${actionResult.startsWith("Error") || actionResult.startsWith("Failed") ? "bg-red-900/30 text-red-300" : "bg-emerald-900/30 text-emerald-300"}`}>
              {actionResult}
            </div>
          )}
        </SectionCard>
      )}

      {/* Active Parameters */}
      {params && (
        <SectionCard title="Active Soft Parameters">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Tier 1 Trust Min</p>
              <p className="text-xl font-mono font-bold">{params.tier1_trust_min}</p>
              <p className="text-xs text-gray-600">Hard bounds: 75-95</p>
            </div>
            <div>
              <p className="text-gray-500">Tier 2 Trust Min</p>
              <p className="text-xl font-mono font-bold">{params.tier2_trust_min}</p>
              <p className="text-xs text-gray-600">Hard bounds: 55-80</p>
            </div>
            <div>
              <p className="text-gray-500">Copy Size Fraction</p>
              <p className="text-xl font-mono font-bold">{(params.copy_size_fraction * 100).toFixed(0)}%</p>
              <p className="text-xs text-gray-600">Hard bounds: 10-100%</p>
            </div>
            <div>
              <p className="text-gray-500">Regime</p>
              <RegimeBadge regime={params.regime} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* AI Reasoning */}
      {advisor && (
        <SectionCard title="Last AI Analysis">
          <div className="space-y-4">
            {advisor.timestamp && (
              <p className="text-xs text-gray-500">
                Ran at: {new Date(advisor.timestamp + "Z").toLocaleString()}
              </p>
            )}
            <div>
              <p className="text-sm text-gray-300 leading-relaxed">{advisor.reasoning}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions Taken (Auto-Applied)</p>
              <ul className="space-y-1.5">
                {advisor.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-400 mt-0.5 shrink-0">-</span>
                    <span className="text-gray-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {advisor.wallet_review && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Wallet Review</p>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400">
                    Active: <span className="text-white font-bold">{advisor.wallet_review.active}</span>
                  </span>
                  <span className="text-gray-400">
                    Deactivated: <span className="text-white font-bold">{advisor.wallet_review.deactivated}</span>
                  </span>
                </div>
                {advisor.wallet_review.top_performers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {advisor.wallet_review.top_performers.map((w, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded text-xs">
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Wallet Health */}
      {walletHealth.length > 0 && (
        <SectionCard title="Wallet Health">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">Wallet</th>
                  <th className="px-3 py-2 text-right text-gray-500">Score</th>
                  <th className="px-3 py-2 text-right text-gray-500">Win Rate</th>
                  <th className="px-3 py-2 text-right text-gray-500">Trades</th>
                  <th className="px-3 py-2 text-right text-gray-500">30d P&L</th>
                  <th className="px-3 py-2 text-right text-gray-500">30d Trades</th>
                  <th className="px-3 py-2 text-center text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {walletHealth.sort((a, b) => b.avg_score - a.avg_score).map((w, i) => {
                  const scoreColor = w.avg_score >= 70 ? "text-emerald-400" : w.avg_score >= 55 ? "text-yellow-300" : "text-red-400";
                  const pnlColor = w.recent_pnl >= 0 ? "text-emerald-400" : "text-red-400";
                  return (
                    <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-3 py-2">
                        <span className="text-gray-300">{w.label}</span>
                        <span className="text-gray-600 text-xs ml-2">{w.address}</span>
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${scoreColor}`}>
                        {w.avg_score.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {w.trades > 0 ? `${(w.win_rate * 100).toFixed(0)}%` : "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">{w.trades}</td>
                      <td className={`px-3 py-2 text-right font-mono ${pnlColor}`}>
                        {w.recent_pnl !== 0 ? `$${w.recent_pnl.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">{w.recent_trades}</td>
                      <td className="px-3 py-2 text-center">
                        {w.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded text-xs">active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-900/50 text-red-300 rounded text-xs">demoted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Action History */}
      {actionHistory.length > 0 && (
        <SectionCard title="AI Action History">
          <div className="space-y-2">
            {actionHistory.slice().reverse().map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-800/50 pb-2">
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.decision} />
                  <span className="text-gray-300">{a.action.replace(/_/g, " ")}</span>
                  <span className="text-gray-500">{a.label || a.wallet || a.param}</span>
                </div>
                <div className="flex items-center gap-3">
                  {a.reason && <span className="text-xs text-gray-600">{a.reason}</span>}
                  <span className="text-xs text-gray-500">{new Date(a.decided_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Signal Skip Reasons (Debug) */}
      <SectionCard title="Signal Skip Reasons (Last 24h)">
        {skipReasons.length === 0 ? (
          <p className="text-gray-500 text-sm">No skip data yet</p>
        ) : (
          <div className="space-y-2">
            {skipReasons.map((s, i) => {
              const maxCount = skipReasons[0]?.count || 1;
              const barWidth = Math.max(5, (s.count / maxCount) * 100);
              const isHardRule = s.reason.startsWith("hard_rule:");
              const isWash = s.reason.startsWith("wash");
              const isExit = s.reason.startsWith("exit_liquidity");
              const isTier = s.reason.startsWith("below_tier");
              const barColor = isHardRule ? "bg-red-800" : isWash ? "bg-orange-800" : isExit ? "bg-yellow-800" : isTier ? "bg-blue-800" : "bg-gray-700";

              let displayReason = s.reason;
              if (s.reason.startsWith("exit_liquidity:exit_liquidity: ")) {
                displayReason = s.reason.replace("exit_liquidity:exit_liquidity: ", "Exit Liq: ");
              } else if (s.reason.startsWith("below_tier2: ")) {
                displayReason = s.reason.replace("below_tier2: ", "Below T2: ");
              } else if (s.reason === "wash_filter_flagged") {
                displayReason = "Wash trade flagged";
              } else if (s.reason.startsWith("hard_rule:")) {
                displayReason = "Hard rule: " + s.reason.slice(10);
              } else if (s.reason.startsWith("category_disabled:")) {
                displayReason = "Category disabled: " + s.reason.slice(18);
              }

              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 text-right text-sm font-mono text-gray-400">{s.count}</div>
                  <div className="flex-1">
                    <div className={`h-5 rounded ${barColor} flex items-center px-2`} style={{ width: `${barWidth}%` }}>
                      <span className="text-xs text-gray-200 truncate">{displayReason}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-600 mt-2">
              Red = hard rules | Orange = wash filter | Yellow = exit liquidity | Blue = below tier threshold
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
