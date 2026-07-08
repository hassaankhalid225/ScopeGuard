/** Helpers for working with whole-currency-unit amounts. */

export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** Sequential, human-readable invoice number, e.g. SG-2026-0042 */
export function buildInvoiceNumber(sequence: number): string {
  const year = new Date().getUTCFullYear();
  return `SG-${year}-${String(sequence).padStart(4, '0')}`;
}
