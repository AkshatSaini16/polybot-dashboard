export interface Position {
  condition_id: string;
  token_id: string;
  side: string;
  entry_price: number;
  current_price: number;
  size_usdt: number;
  pnl: number;
  pnl_pct: number;
  opened_at: string;
  source_wallet: string;
  category: string;
  question?: string;
  polymarket_url?: string;
}

export interface Trade {
  id: number;
  condition_id: string;
  wallet: string;
  side: string;
  price: number;
  size_usdt: number;
  pnl: number;
  timestamp: string;
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

export interface Meta {
  exported_at: string;
  bot_running: boolean;
  current_regime: string;
  starting_capital_usdt: number;
  starting_capital_inr: number;
}
