export function formatEthereumQuantity(
  value: string | null | undefined,
  decimals: string | null | undefined = '18',
  maxFractionDigits = 8,
): string {
  const normalizedValue = normalizeEthereumInteger(value);
  const decimalPlaces = parseEthereumDecimals(decimals);
  if (normalizedValue === null || decimalPlaces === null) {
    return 'Unavailable';
  }

  const amount = BigInt(normalizedValue);
  if (decimalPlaces === 0) {
    return formatEthereumInteger(amount.toString());
  }

  const divisor = 10n ** BigInt(decimalPlaces);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  let fraction = remainder.toString().padStart(decimalPlaces, '0').replace(/0+$/, '');
  if (fraction.length > maxFractionDigits) {
    fraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  }
  return fraction
    ? `${formatEthereumInteger(whole.toString())}.${fraction}`
    : formatEthereumInteger(whole.toString());
}

export function formatEthereumInteger(value: string | null | undefined): string {
  const normalized = normalizeEthereumInteger(value);
  return normalized === null ? 'Unavailable' : normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
