export interface Position {
  condition_id: string;
  token_id: string;
  side: string;
  entry_price: number;
  current_price: number;
  size_usdt: number;
  size_inr?: number;
  pnl: number;
  pnl_inr?: number;
  pnl_pct: number;
  opened_at: string;
  age_hours?: number;
  queue?: "active" | "stale";
  source_wallet: string;
  category: string;
  question?: string;
  polymarket_url?: string;
  bet_description?: string;
}

export interface Trade {
  id: number;
  condition_id: string;
  wallet: string;
  side: string;
  price: number;
  size_usdt: number;
  size_inr?: number;
  pnl: number;
  pnl_inr?: number;
  timestamp: string;
  question?: string;
  polymarket_url?: string;
  bet_description?: string;
  tier: number;
  category: string;
  status: string;
}

export interface DailyPnL {
  date: string;
  pnl: number;
  cumulative: number;
}

export interface CategoryBreakdown {
  category: string;
  pnl: number;
  trades: number;
  win_rate: number;
}

export interface QueueStats {
  active_slots_used: number;
  active_slots_max: number;
  stale_count: number;
  active_locked_usdt: number;
  stale_locked_usdt: number;
  stale_capital_cap_pct: number;
  free_capital_usdt: number;
}

export interface Portfolio {
  balance_usdt: number;
  balance_inr: number;
  active_capital_usdt: number;
  reserve_usdt: number;
  regime: string;
  bot_status: string;
  positions: Position[];
  total_unrealized_pnl: number;
  last_updated: string;
  queue?: QueueStats;
}

export interface Analytics {
  total_pnl: number;
  total_trades: number;
  win_rate: number;
  best_trade: number;
  worst_trade: number;
  monthly_alpha_est: number;
  daily_pnl: DailyPnL[];
  category_breakdown: CategoryBreakdown[];
  signals_generated: number;
  signals_executed: number;
}

export interface AiAdvisor {
  timestamp?: string;
  regime: string;
  confidence?: string;
  reasoning: string;
  deactivated_wallets?: { label: string; reason: string }[];
  signals_6h?: { total: number; executed: number; wash_filtered: number; below_tier2: number };
  positions?: { open: number; closed: number; total_pnl: number; win_rate: number };
  params_before?: Record<string, unknown>;
  params_after?: Record<string, unknown>;
}

export interface SoftParams {
  tier1_trust_min: number;
  tier2_trust_min: number;
  copy_size_fraction: number;
  regime: string;
}

export interface SkipReason {
  reason: string;
  count: number;
}

export interface WalletHealthEntry {
  address: string;
  label: string;
  is_active: boolean;
  avg_score: number;
  trades: number;
  win_rate: number;
  recent_pnl: number;
  recent_trades: number;
}

export interface AiProposal {
  action: string;
  wallet?: string;
  label?: string;
  param?: string;
  value?: number;
  category?: string;
  reason: string;
  tier: number;
}

export interface AiAction {
  action: string;
  wallet?: string;
  label?: string;
  param?: string;
  value?: number;
  reason?: string;
  decision: string;
  decided_at: string;
}

export interface Investment {
  date: string;
  amount_inr: number;
  amount_usdt: number;
  label: string;
}

export interface Meta {
  exported_at: string;
  last_pushed_at?: string;
  bot_running: boolean;
  current_regime: string;
  soft_params?: SoftParams;
  ai_advisor?: AiAdvisor;
  starting_capital_usdt: number;
  starting_capital_inr: number;
  investments?: Investment[];
  total_invested_inr?: number;
  total_invested_usdt?: number;
  skip_reasons?: SkipReason[];
  last_signal_at?: string;
  bot_uptime_hours?: number;
  pending_proposals?: AiProposal[];
  approved_queue?: AiProposal[];
  action_history?: AiAction[];
  wallet_health?: WalletHealthEntry[];
}
