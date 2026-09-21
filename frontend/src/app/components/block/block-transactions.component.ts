import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { StateService } from '@app/services/state.service';
import { Transaction, Vout } from '@interfaces/electrs.interface';
import { Observable, Subject, Subscription, catchError, combineLatest, distinctUntilChanged, map, of, retry, startWith, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectrsApiService } from '@app/services/electrs-api.service';
import { PreloadService } from '@app/services/preload.service';

@Component({
  selector: 'app-block-transactions',
  templateUrl: './block-transactions.component.html',
  styleUrl: './block-transactions.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockTransactionsComponent implements OnInit {
  @Input() txCount: number;
  @Input() timestamp: number;
  @Input() blockHash: string;
  @Input() previousBlockHash: string;
  @Input() block$: Observable<any>;
  @Input() block: any;
  @Input() paginationMaxSize: number;
  @Output() blockReward = new EventEmitter<number>();

  itemsPerPage = this.stateService.env.ITEMS_PER_PAGE;
  page = 1;

  transactions$: Observable<Transaction[]>;
  isLoadingTransactions = true;
  transactionsError: any = null;
  transactionSubscription: Subscription;
  txsLoadingStatus$: Observable<number>;
  nextBlockTxListSubscription: Subscription;
  private retryTransactions$ = new Subject<void>();

  constructor(
    private stateService: StateService,
    private route: ActivatedRoute,
    private router: Router,
    private electrsApiService: ElectrsApiService,
  ) { }

  ngOnInit(): void {
    // The parent only creates this table once it has resolved `block`, while
    // its route observable can already have emitted. Seed the stream from the
    // resolved input so a direct historical link always fetches page one.
    const currentBlock$ = this.block$.pipe(
      startWith(this.block),
      distinctUntilChanged((previous, current) => previous?.id === current?.id),
    );

    this.transactions$ = combineLatest([
      currentBlock$,
      // A direct block link can create this component after the initial query
      // params emission. Seed it from the route snapshot so page one loads.
      this.route.queryParams.pipe(startWith(this.route.snapshot.queryParams)),
      this.retryTransactions$.pipe(startWith(undefined)),
    ]).pipe(
      tap(([_, queryParams]) => {
        this.page = +queryParams['page'] || 1;
        this.transactionsError = null;
      }),
      switchMap(([block, _]) => this.electrsApiService.getBlockTransactions$(block.id, (this.page - 1) * this.itemsPerPage)
        .pipe(
          // The adapter already bounds provider calls and falls back across
          // providers. A 1.2 second UI timeout was cancelling healthy calls.
          retry({ count: 1, delay: 500 }),
          catchError((err) => {
            this.transactionsError = err;
            return of([]);
          }),
          startWith(null),
        )),
      tap((transactions: Transaction[]) => {
        // The block API doesn't contain the block rewards on Liquid
        if (this.stateService.isLiquid() && transactions && transactions[0] && transactions[0].vin[0].is_coinbase) {
          const blockReward = transactions[0].vout.reduce((acc: number, curr: Vout) => acc + curr.value, 0) / 100000000;
          this.blockReward.emit(blockReward);
        }
      })
    );

    this.txsLoadingStatus$ = this.route.paramMap
      .pipe(
        switchMap(() => this.stateService.loadingIndicators$),
        map((indicators) => indicators['blocktxs-' + this.blockHash] !== undefined ? indicators['blocktxs-' + this.blockHash] : 0)
      );
  }

  pageChange(page: number, target: HTMLElement): void {
    target.scrollIntoView(); // works for chrome
    this.router.navigate([], { queryParams: { page: page }, queryParamsHandling: 'merge' });
  }

  retryTransactions(): void {
    this.retryTransactions$.next();
  }
}
