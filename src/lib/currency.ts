// INR/USDT conversion rate (update periodically)
export const INR_PER_USDT = 83.5;

export function usdtToInr(usdt: number): number {
  return usdt * INR_PER_USDT;
}

export function inrToUsdt(inr: number): number {
  return inr / INR_PER_USDT;
}

export function formatUsdt(amount: number): string {
  const sign = amount >= 0 ? "" : "-";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

export function formatInr(amount: number): string {
  const sign = amount >= 0 ? "" : "-";
  return `${sign}\u20B9${Math.abs(amount).toFixed(2)}`;
}

export function formatBoth(usdt: number): string {
  return `${formatUsdt(usdt)} / ${formatInr(usdtToInr(usdt))}`;
}
