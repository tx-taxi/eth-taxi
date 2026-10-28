import { EthereumTokenTransfer } from '@interfaces/ethereum-api.interface';

/** An estimate using the token's current USD quote, not its price at transfer time. */
export function currentTokenTransferUsd(transfer: EthereumTokenTransfer): string | null {
  if (transfer.token?.type !== 'ERC-20') return null;
  const value = transfer.value?.trim();
  const decimals = transfer.token.decimals?.trim();
  const rate = transfer.token.exchangeRate?.trim();
  if (!value || !/^\d+$/.test(value) || !decimals || !/^\d+$/.test(decimals) || !rate || !/^\d+(?:\.\d+)?$/.test(rate)) return null;
  const places = Number(decimals);
  if (!Number.isSafeInteger(places) || places > 255) return null;
  const [whole, fraction = ''] = rate.split('.');
  const rateUnits = BigInt(whole + fraction);
  if (rateUnits === 0n) return null;
  const divisor = 10n ** BigInt(places + fraction.length);
  const numerator = BigInt(value) * rateUnits * 100n;
  const cents = (numerator + divisor / 2n) / divisor;
  if (cents === 0n && numerator > 0n) return '<$0.01';
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents) / 100);
}

/** Use the same current ETH quote snapshot for both sides of a USD conversion. */
export function currentUsdToFiat(value: number, currency: string, conversions: Record<string, number> | null): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  if (currency === 'USD') return value;
  const usd = conversions?.USD;
  const selected = conversions?.[currency];
  if (!Number.isFinite(usd) || !Number.isFinite(selected) || usd <= 0 || selected <= 0) return null;
  const result = value * selected / usd;
  return Number.isFinite(result) && result <= Number.MAX_SAFE_INTEGER ? result : null;
}

/** Token quotes are current estimates, even when the transfer itself is historical. */
export function currentTokenTransferFiat(transfer: EthereumTokenTransfer, currency: string, conversions: Record<string, number> | null): string | null {
  if (currency === 'USD') return currentTokenTransferUsd(transfer);
  if (transfer.token?.type !== 'ERC-20') return null;
  const value = transfer.value?.trim();
  const decimals = transfer.token.decimals?.trim();
  const rate = transfer.token.exchangeRate?.trim();
  if (!value || !/^\d+$/.test(value) || !decimals || !/^\d+$/.test(decimals) || !rate || !/^\d+(?:\.\d+)?$/.test(rate)) return null;
  const places = Number(decimals);
  if (!Number.isSafeInteger(places) || places > 255 || Number(rate) <= 0) return null;
  const padded = value.padStart(places + 1, '0');
  const amount = places ? Number(padded.slice(0, -places) + '.' + padded.slice(-places)) : Number(padded);
  const converted = currentUsdToFiat(amount * Number(rate), currency, conversions);
  if (converted === null) return null;
  try {
    const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });
    const minimum = 10 ** -(formatter.resolvedOptions().maximumFractionDigits ?? 2);
    if (converted > 0 && converted < minimum) return '<' + formatter.format(minimum);
    return formatter.format(converted);
  } catch {
    return null;
  }
}
