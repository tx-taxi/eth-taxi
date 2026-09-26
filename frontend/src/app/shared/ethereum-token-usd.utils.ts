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
