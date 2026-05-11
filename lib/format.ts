export function formatKrw(amount: number | bigint): string {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "0원";
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatKrwShort(amount: number | bigint): string {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "0원";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatYearMonth(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input + (input.length === 7 ? "-01" : "")) : input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function parseYearMonth(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y ?? new Date().getFullYear(), (m ?? 1) - 1, 1);
}
