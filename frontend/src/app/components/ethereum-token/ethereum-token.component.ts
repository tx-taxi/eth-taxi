import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

import { EthereumIdentityEntity } from '@components/ethereum-identity/ethereum-identity.component';
import {
  EthereumIdentity,
  EthereumToken,
  EthereumTokenTransfer,
} from '@interfaces/ethereum-api.interface';
import { EthereumApiService } from '@app/services/ethereum-api.service';

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
  token: EthereumToken | null = null;
  transfers: EthereumTokenTransferView[] = [];
  tokenAddress = '';
  isLoading = true;
  errorMessage = '';
  logoFailed = false;

  private routeSubscription?: Subscription;
  private loadSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private ethereumApiService: EthereumApiService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.tokenAddress = params.get('id')?.trim() || '';
      this.loadToken();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
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
    return this.token?.name?.trim() || this.token?.symbol?.trim() || 'Ethereum token';
  }

  formatTransferAmount(transfer: EthereumTokenTransfer): string {
    return this.formatUnits(transfer.value, transfer.token.decimals, 8);
  }

  transferExactAmount(transfer: EthereumTokenTransfer): string {
    return this.formatUnits(transfer.value, transfer.token.decimals);
  }

  formatSupply(value: string | null | undefined): string {
    return this.formatUnits(value, this.token?.decimals, 4);
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

  formatUsd(value: string | null | undefined, maxFractionDigits = 2): string {
    const formatted = this.formatDecimal(value, maxFractionDigits);
    return formatted ? `$${formatted}` : '';
  }

  formatTimestamp(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  }

  trackTransfer(index: number, item: EthereumTokenTransferView): string {
    return `${item.transfer.transactionHash}:${item.transfer.logIndex || index}`;
  }

  private loadToken(): void {
    this.loadSubscription?.unsubscribe();
    this.token = null;
    this.transfers = [];
    this.errorMessage = '';
    this.logoFailed = false;

    if (!this.tokenAddress) {
      this.isLoading = false;
      this.errorMessage = 'No token contract address was provided.';
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.isLoading = true;
    this.changeDetectorRef.markForCheck();
    this.loadSubscription = forkJoin({
      token: this.ethereumApiService.getToken$(this.tokenAddress),
      transfers: this.ethereumApiService.getTokenTransfers$(this.tokenAddress),
    }).subscribe({
      next: ({ token, transfers }) => {
        this.token = token;
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
          ? 'Token not found on Ethereum.'
          : 'Token data is temporarily unavailable. Please try again.';
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

  private formatUnits(
    value: string | null | undefined,
    decimals: string | null | undefined,
    maxFractionDigits?: number,
  ): string {
    const normalized = this.normalizeInteger(value);
    if (normalized === null) {
      return '';
    }

    const decimalPlaces = this.parseDecimals(decimals);
    const amount = BigInt(normalized);
    if (decimalPlaces === 0) {
      return this.groupInteger(amount.toString());
    }

    const divisor = 10n ** BigInt(decimalPlaces);
    const integer = amount / divisor;
    const remainder = amount % divisor;
    let fraction = remainder.toString().padStart(decimalPlaces, '0').replace(/0+$/, '');
    if (maxFractionDigits !== undefined && fraction.length > maxFractionDigits) {
      fraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
    }

    return fraction
      ? `${this.groupInteger(integer.toString())}.${fraction}`
      : this.groupInteger(integer.toString());
  }

  private formatDecimal(value: string | null | undefined, maxFractionDigits: number): string {
    const normalized = value?.trim();
    if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) {
      return '';
    }
    const [integer, rawFraction = ''] = normalized.split('.');
    const fraction = rawFraction.slice(0, maxFractionDigits).replace(/0+$/, '');
    return fraction
      ? `${this.groupInteger(BigInt(integer).toString())}.${fraction}`
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

  private groupInteger(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
