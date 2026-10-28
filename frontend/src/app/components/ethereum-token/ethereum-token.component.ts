import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, Inject, LOCALE_ID } from '@angular/core';
import { formatEthereumInteger, localizeEthereumFraction } from '@app/shared/ethereum-quantity.utils';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, forkJoin, of, Subscription } from 'rxjs';
import { catchError, startWith } from 'rxjs/operators';

import { EthereumIdentityEntity } from '@components/ethereum-identity/ethereum-identity.component';
import {
  EthereumIdentity,
  EthereumPaginationParams,
  EthereumToken,
  EthereumTokenTransfer,
} from '@interfaces/ethereum-api.interface';
import { EthereumApiService } from '@app/services/ethereum-api.service';
import { currentTokenTransferFiat, currentUsdToFiat } from '@app/shared/ethereum-token-usd.utils';
import { StateService } from '@app/services/state.service';

interface EthereumTokenTransferView {
  transfer: EthereumTokenTransfer;
  from: EthereumIdentityEntity;
  to: EthereumIdentityEntity | null;
}

@Component({
  selector: 'app-ethereum-token',
  templateUrl: './ethereum-token.component.html',
  styleUrls: ['./ethereum-token.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EthereumTokenComponent implements OnInit, OnDestroy {
  currency = 'USD';
  conversions: Record<string, number> | null = null;
  private fiatSubscription?: Subscription;

  currentTokenTransferFiat(transfer: EthereumTokenTransfer): string | null {
    return currentTokenTransferFiat(transfer, this.currency, this.conversions, this.locale);
  }
  token: EthereumToken | null = null;
  transfers: EthereumTokenTransferView[] = [];
  tokenAddress = '';
  isLoading = true;
  errorMessage = '';
  transfersUnavailable = false;
  transfersRecentOnly = false;
  nextPageParams: EthereumPaginationParams | null = null;
  loadingMore = false;
  loadMoreError = false;
  showAllTransfers = false;
  logoFailed = false;

  private routeSubscription?: Subscription;
  private loadSubscription?: Subscription;
  private loadMoreSubscription?: Subscription;

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private route: ActivatedRoute,
    private stateService: StateService,
    private ethereumApiService: EthereumApiService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fiatSubscription = combineLatest([this.stateService.fiatCurrency$, this.stateService.conversions$.pipe(startWith(null))]).subscribe(([currency, conversions]) => {
      this.currency = currency;
      this.conversions = conversions;
      this.changeDetectorRef.markForCheck();
    });
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.tokenAddress = params.get('id')?.trim() || '';
      this.loadToken();
    });
  }

  ngOnDestroy(): void {
    this.fiatSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
    this.loadMoreSubscription?.unsubscribe();
  }

  retry(): void {
    this.loadToken();
  }

  onLogoError(): void {
    this.logoFailed = true;
  }

  tokenInitials(): string {
    const source = this.token?.symbol?.trim() || this.token?.name?.trim() || 'ETH';
    return source.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'ETH';
  }

  tokenTitle(): string {
    return this.token?.name?.trim() || this.token?.symbol?.trim() || $localize`:@@eth.token.generic:Ethereum token`;
  }

  formatTransferAmount(transfer: EthereumTokenTransfer): string {
    return this.formatUnits(transfer.value, this.transferDecimals(transfer), 8);
  }

  transferExactAmount(transfer: EthereumTokenTransfer): string {
    const amount = this.formatUnits(transfer.value, this.transferDecimals(transfer));
    const symbol = transfer.token.symbol?.trim() || this.token?.symbol?.trim() || $localize`:@@eth.token.tokens:tokens`;
    return transfer.tokenId ? `${amount} ${symbol} #${transfer.tokenId}` : `${amount} ${symbol}`;
  }

  transferSymbol(transfer: EthereumTokenTransfer): string {
    const symbol = transfer.token.symbol?.trim() || this.token?.symbol?.trim() || $localize`:@@eth.token.tokens:tokens`;
    const id = transfer.tokenId;
    if (!id) return symbol;
    return `${symbol} #${id.length > 16 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id}`;
  }

  formatSupply(value: string | null | undefined): string {
    return this.formatUnits(value, this.token?.decimals, 4);
  }

  formatCompactSupply(value: string | null | undefined): string {
    const fullValue = this.formatUnits(value, this.token?.decimals, 4, 'en-US').replace(/,/g, '');
    const numericValue = Number(fullValue);
    if (!Number.isFinite(numericValue)) {
      return this.formatSupply(value);
    }
    return new Intl.NumberFormat(this.locale, {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  exactSupply(value: string | null | undefined): string {
    return this.formatUnits(value, this.token?.decimals);
  }

  formatInteger(value: string | null | undefined): string {
    const normalized = this.normalizeInteger(value);
    if (normalized === null) {
      return '';
    }
    return this.groupInteger(normalized);
  }

  formatFiat(value: string | null | undefined, maxFractionDigits = 2): string {
    if (this.currency === 'USD') {
      const formatted = this.formatDecimal(value, maxFractionDigits);
      return formatted ? `$${formatted}` : '';
    }
    if (!value || !/^\d+(?:\.\d+)?$/.test(value.trim())) return '';
    const converted = currentUsdToFiat(Number(value), this.currency, this.conversions);
    if (converted === null) return '';
    try {
      const formatter = new Intl.NumberFormat(this.locale, { style: 'currency', currency: this.currency, minimumFractionDigits: 0, maximumFractionDigits: maxFractionDigits });
      const minimum = 10 ** -maxFractionDigits;
      if (converted > 0 && converted < minimum) return '<' + formatter.format(minimum);
      return formatter.format(converted);
    } catch {
      return '';
    }
  }

  formatTimestamp(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      return value;
    }
    return new Intl.DateTimeFormat(this.locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  }

  trackTransfer(index: number, item: EthereumTokenTransferView): string {
    return `${item.transfer.transactionHash}:${item.transfer.logIndex || index}`;
  }

  get visibleTransfers(): EthereumTokenTransferView[] {
    return this.showAllTransfers ? this.transfers : this.transfers.slice(0, 20);
  }

  get hiddenTransferCount(): number {
    return Math.max(0, this.transfers.length - 20);
  }

  toggleTransfers(): void {
    this.showAllTransfers = !this.showAllTransfers;
  }

  loadMoreTransfers(): void {
    if (!this.nextPageParams || this.loadingMore) return;
    this.loadingMore = true;
    this.loadMoreError = false;
    const address = this.tokenAddress;
    this.loadMoreSubscription = this.ethereumApiService.getTokenTransfers$(address, this.nextPageParams).subscribe({
      next: (page) => {
        const seen = new Set(this.transfers.map(({transfer}) => `${transfer.transactionHash}:${transfer.logIndex}`));
        const older = page.items.filter((transfer) => !seen.has(`${transfer.transactionHash}:${transfer.logIndex}`));
        this.transfers.push(...older.map((transfer) => ({
          transfer,
          from: this.toIdentityEntity(transfer.from),
          to: transfer.to ? this.toIdentityEntity(transfer.to) : null,
        })));
        this.nextPageParams = page.nextPageParams || null;
        this.showAllTransfers = true;
        this.loadingMore = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.loadingMore = false;
        this.loadMoreError = true;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private loadToken(): void {
    this.loadSubscription?.unsubscribe();
    this.loadMoreSubscription?.unsubscribe();
    this.token = null;
    this.transfers = [];
    this.errorMessage = '';
    this.transfersUnavailable = false;
    this.transfersRecentOnly = false;
    this.nextPageParams = null;
    this.loadingMore = false;
    this.loadMoreError = false;
    this.showAllTransfers = false;
    this.logoFailed = false;

    if (!this.tokenAddress) {
      this.isLoading = false;
      this.errorMessage = $localize`:@@eth.token.no-address:No token contract address was provided.`;
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.isLoading = true;
    this.changeDetectorRef.markForCheck();
    this.loadSubscription = forkJoin({
      token: this.ethereumApiService.getToken$(this.tokenAddress),
      transfers: this.ethereumApiService.getTokenTransfers$(this.tokenAddress).pipe(
        catchError(() => {
          this.transfersUnavailable = true;
          return of({
            items: [],
            nextPageParams: null,
            historyUnavailable: true,
            recentOnly: true,
          });
        }),
      ),
    }).subscribe({
      next: ({ token, transfers }) => {
        this.token = token;
        this.transfersUnavailable = this.transfersUnavailable || transfers.historyUnavailable === true || token.historyUnavailable === true;
        this.transfersRecentOnly = transfers.recentOnly === true || token.recentOnly === true;
        this.nextPageParams = transfers.nextPageParams || null;
        this.transfers = transfers.items.map((transfer) => ({
          transfer,
          from: this.toIdentityEntity(transfer.from),
          to: transfer.to ? this.toIdentityEntity(transfer.to) : null,
        }));
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.status === 404
          ? $localize`:@@eth.token.not-found:Token not found on Ethereum.`
          : $localize`:@@eth.token.fetch-error:Token data is temporarily unavailable. Please try again.`;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private toIdentityEntity(identity: EthereumIdentity): EthereumIdentityEntity {
    return {
      address: identity.address,
      displayName: identity.name,
      ensName: identity.ensName,
      iconUrl: identity.iconUrl,
      isContract: identity.isContract,
      isVerified: identity.isVerified,
      isScam: identity.isScam,
      reputation: identity.reputation,
      proxyType: identity.proxyType,
    };
  }

  private transferDecimals(transfer: EthereumTokenTransfer): string | null | undefined {
    return transfer.token.decimals ?? this.token?.decimals;
  }

  private formatUnits(
    value: string | null | undefined,
    decimals: string | null | undefined,
    maxFractionDigits?: number,
    locale = this.locale,
  ): string {
    const normalized = this.normalizeInteger(value);
    if (normalized === null) {
      return '';
    }

    const decimalPlaces = this.parseDecimals(decimals);
    const amount = BigInt(normalized);
    if (decimalPlaces === 0) {
      return this.groupInteger(amount.toString(), locale);
    }

    const divisor = 10n ** BigInt(decimalPlaces);
    const integer = amount / divisor;
    const remainder = amount % divisor;
    let fraction = remainder.toString().padStart(decimalPlaces, '0').replace(/0+$/, '');
    if (maxFractionDigits !== undefined && fraction.length > maxFractionDigits) {
      fraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
    }

    const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
    return fraction
      ? `${this.groupInteger(integer.toString(), locale)}${decimal}${localizeEthereumFraction(fraction, locale)}`
      : this.groupInteger(integer.toString(), locale);
  }

  private formatDecimal(value: string | null | undefined, maxFractionDigits: number): string {
    const normalized = value?.trim();
    if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) {
      return '';
    }
    const [integer, rawFraction = ''] = normalized.split('.');
    const fraction = rawFraction.slice(0, maxFractionDigits).replace(/0+$/, '');
    const decimal = new Intl.NumberFormat(this.locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
    return fraction
      ? `${this.groupInteger(BigInt(integer).toString())}${decimal}${localizeEthereumFraction(fraction, this.locale)}`
      : this.groupInteger(BigInt(integer).toString());
  }

  private normalizeInteger(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized && /^\d+$/.test(normalized) ? BigInt(normalized).toString() : null;
  }

  private parseDecimals(value: string | null | undefined): number {
    const normalized = value?.trim();
    if (!normalized || !/^\d+$/.test(normalized)) {
      return 0;
    }
    const decimals = BigInt(normalized);
    return decimals <= 255n ? parseInt(normalized, 10) : 0;
  }

  private groupInteger(value: string, locale = this.locale): string {
    return formatEthereumInteger(value, locale);
  }
}
