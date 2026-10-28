import { compactBlockAmount } from '@app/shared/block-format';
import { Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { StateService } from '@app/services/state.service';
import { Observable, Subscription } from 'rxjs';
import { Price } from '@app/services/price.service';

@Component({
  selector: 'app-amount',
  templateUrl: './amount.component.html',
  styleUrls: ['./amount.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AmountComponent implements OnInit, OnDestroy {
  conversions$: Observable<any>;
  currency: string;
  viewAmountMode$: Observable<'btc' | 'sats' | 'fiat'>;
  network = '';

  stateSubscription: Subscription;
  currencySubscription: Subscription;

  @Input() satoshis: number;
  @Input() compactBlock = false;
  compactBlockAmount = compactBlockAmount;

  @Input() digitsInfo = '1.8-8';
  @Input() noFiat = false;
  @Input() addPlus = false;
  @Input() blockConversion: Price;
  @Input() forceBtc: boolean = false;
  @Input() ignoreViewMode: boolean = false;
  @Input() forceBlockConversion: boolean = false; // Do not substitute a current quote for a missing historical one.
  @Input() unitStyle: any;

  constructor(
    private stateService: StateService,
    private cd: ChangeDetectorRef,
  ) {
    this.currencySubscription = this.stateService.fiatCurrency$.subscribe((fiat) => {
      this.currency = fiat;
      this.cd.markForCheck();
    });
  }

  ngOnInit() {
    this.viewAmountMode$ = this.stateService.viewAmountMode$.asObservable();
    this.conversions$ = this.stateService.conversions$.asObservable();
    this.stateSubscription = this.stateService.networkChanged$.subscribe((network) => this.network = network);
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    this.currencySubscription.unsubscribe();
  }

  fiatAmount(conversions: Record<string, number> | null): number | null {
    const historical = this.blockConversion?.price;
    const rate = historical ? historical[this.currency] : this.forceBlockConversion ? undefined : conversions?.[this.currency];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 ||
        typeof this.satoshis !== 'number' || !Number.isFinite(this.satoshis)) {
      return null;
    }
    const amount = rate * this.satoshis / 1e18;
    return Number.isFinite(amount) ? amount : null;
  }

}
