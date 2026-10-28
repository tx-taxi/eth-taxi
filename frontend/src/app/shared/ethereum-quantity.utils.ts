export function formatEthereumQuantity(
  value: string | null | undefined,
  decimals: string | null | undefined = '18',
  maxFractionDigits = 8,
  locale = 'en-US',
): string {
  const normalizedValue = normalizeEthereumInteger(value);
  const decimalPlaces = parseEthereumDecimals(decimals);
  if (normalizedValue === null || decimalPlaces === null) {
    return 'Unavailable';
  }

  const amount = BigInt(normalizedValue);
  if (decimalPlaces === 0) {
    return formatEthereumInteger(amount.toString(), locale);
  }

  const divisor = 10n ** BigInt(decimalPlaces);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  let fraction = remainder.toString().padStart(decimalPlaces, '0').replace(/0+$/, '');
  if (fraction.length > maxFractionDigits) {
    fraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  }
  const decimalSeparator = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
  return fraction
    ? `${formatEthereumInteger(whole.toString(), locale)}${decimalSeparator}${fraction}`
    : formatEthereumInteger(whole.toString(), locale);
}

export function formatEthereumInteger(value: string | null | undefined, locale = 'en-US'): string {
  const normalized = normalizeEthereumInteger(value);
  return normalized === null ? 'Unavailable' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(normalized));
}

function normalizeEthereumInteger(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }
  return BigInt(normalized).toString();
}

function parseEthereumDecimals(value: string | null | undefined): number | null {
  const normalized = value?.trim();
  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }
  const decimals = BigInt(normalized);
  return decimals <= 255n ? Number(decimals) : null;
}
