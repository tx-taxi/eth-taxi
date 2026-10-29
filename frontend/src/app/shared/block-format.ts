const DECIMALS = 18, SYMBOL = 'ETH', FEE_UNIT = 'gwei', FEE_SCALE = 1000000000;

// The document language follows the explicitly selected explorer or hub route.
// Formatting is visual only; raw amounts and chain data remain unchanged.
function displayLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement?.lang || '' : '';
  const match = /^(es|fr|de|it|pt|nl|ru|ja|zh|ko|uk|vi|pl|cs|sv)(?:-|$)/i.exec(lang);
  return match ? match[1].toLowerCase() : 'en-US';
}
function displayExactNumber(value: string): string {
  const separator = new Intl.NumberFormat(displayLocale()).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
  return value.replace('.', separator);
}

// Slavic languages use different plural forms for transaction counts.
export function localizedSlavicTransactionCount(count: number): string | null {
  const locale = displayLocale();
  if (!['ru', 'uk', 'pl', 'cs'].includes(locale) || !Number.isFinite(count)) return null;
  const form = new Intl.PluralRules(locale).select(count);
  const words = locale === 'cs' ? ['transakce', 'transakce', 'transakcí']
    : locale === 'pl' ? ['transakcja', 'transakcje', 'transakcji']
    : locale === 'uk' ? ['транзакція', 'транзакції', 'транзакцій'] : ['транзакция', 'транзакции', 'транзакций'];
  const noun = form === 'one' ? words[0] : form === 'few' || (locale === 'cs' && form === 'many') ? words[1] : words[2];
  return `${count.toLocaleString(locale)} ${noun}`;
}

/** Preserve singular Swedish counts while keeping existing Slavic inflection. */
export function localizedTransactionCount(count: number): string | null {
  if (displayLocale() === 'sv' && Number.isFinite(count)) {
    const noun = new Intl.PluralRules('sv').select(count) === 'one' ? 'transaktion' : 'transaktioner';
    return `${count.toLocaleString('sv')} ${noun}`;
  }
  return localizedSlavicTransactionCount(count);
}


// Presentation only: never round provider data or detail-page amounts.
export function compactBlockNumber(value: number, amount = false): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs > 0 && abs < 0.001) return (value < 0 ? '>−' : '<') + displayExactNumber('0.001');
  if (abs >= 1000) {
    const units = ['', 'k', 'M', 'B', 'T'];
    let group = Math.min(4, Math.floor(Math.log10(abs) / 3));
    let scaled = Number((value / 1000 ** group).toPrecision(3));
    if (Math.abs(scaled) >= 1000 && group < 4) { group++; scaled /= 1000; }
    return scaled.toLocaleString(displayLocale(), { maximumSignificantDigits: 3, useGrouping: false }) + units[group];
  }
  return value.toLocaleString(displayLocale(), amount
    ? { minimumFractionDigits: 2, maximumFractionDigits: 3, useGrouping: false }
    : { maximumSignificantDigits: 3, useGrouping: false });
}

export function compactBlockAmount(value: number | string, atomic = false): string {
  if (value == null) return '—';
  return compactBlockNumber(Number(value) / (atomic ? 1 : 10 ** DECIMALS), !atomic);
}

export function exactBlockAmount(value: number | string): string {
  if (value == null) return '—';
  try {
    const n = BigInt(value), abs = n < 0n ? -n : n, scale = 10n ** BigInt(DECIMALS);
    const fraction = (abs % scale).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
    return (n < 0n ? '-' : '') + (abs / scale).toString() + (fraction ? '.' + fraction : '');
  } catch { return '—'; }
}

export function blockValueDetails(total: number | string, median: number, min: number, max: number, feeLabel?: string): string {
  const rate = (value: number) => value == null || !Number.isFinite(value) ? '—' : displayExactNumber(String(value / FEE_SCALE));
  const totalLabel = feeLabel ?? ($localize`:@@eth.blockDetails.totalFees:Total fees`);
  const medianLabel = $localize`:@@eth.blockDetails.medianFee:Median fee rate`;
  const rangeLabel = $localize`:@@eth.blockDetails.feeRange:Fee range`;
  return `${totalLabel}: ${displayExactNumber(exactBlockAmount(total))} ${SYMBOL}. ${medianLabel}: ${rate(median)} ${FEE_UNIT}. ${rangeLabel}: ${rate(min)}–${rate(max)} ${FEE_UNIT}.`;
}
