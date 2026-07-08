export function money(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function relativeDays(value: string | null | undefined): string {
  if (!value) return '';
  const diff = Math.round((new Date(value).getTime() - Date.now()) / 864e5);
  if (diff === 0) return 'today';
  if (diff > 0) return `in ${diff}d`;
  return `${Math.abs(diff)}d overdue`;
}
