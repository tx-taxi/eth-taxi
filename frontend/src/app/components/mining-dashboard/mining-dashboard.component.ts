import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { SeoService } from '@app/services/seo.service';
import { WebsocketService } from '@app/services/websocket.service';
import { BlockExtended, EthereumGasMarketStats } from '@interfaces/node-api.interface';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface ProductionSample {
  blocks: BlockExtended[];
  averageInterval: number | null;
  averageGasUsed: number;
  transactionCount: number;
  error: boolean;
}

@Component({
  selector: 'app-mining-dashboard',
  templateUrl: './mining-dashboard.component.html',
  styleUrls: ['./mining-dashboard.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiningDashboardComponent implements OnInit {
  production$: Observable<ProductionSample>;
  gasMarket$: Observable<EthereumGasMarketStats[]>;
  gasMarketError = false;

  constructor(
    private apiService: ApiService,
    private seoService: SeoService,
    private websocketService: WebsocketService,
  ) {}

  ngOnInit(): void {
    this.websocketService.want(['blocks', 'stats']);
    this.seoService.setTitle('Ethereum Block Production');
    this.seoService.setDescription('Follow recent Ethereum blocks, fee recipients, gas usage, transaction activity, and the live gas market.');

    this.production$ = timer(0, 12_000).pipe(
      switchMap(() => this.apiService.getBlocks$(undefined).pipe(
        map(blocks => this.summarize(blocks)),
        catchError(() => of({ blocks: [], averageInterval: null, averageGasUsed: 0, transactionCount: 0, error: true })),
      )),
    );

    this.gasMarket$ = timer(0, 15_000).pipe(
      switchMap(() => this.apiService.list2HStatistics$().pipe(
        map(samples => {
          this.gasMarketError = false;
          return samples;
        }),
        catchError(() => {
          this.gasMarketError = true;
          return of([]);
        }),
      )),
    );
  }

  private summarize(blocks: BlockExtended[]): ProductionSample {
    const recent = [...blocks].sort((a, b) => b.height - a.height).slice(0, 6);
    const intervals = recent.slice(0, -1).map((block, index) =>
      Math.abs(block.timestamp - recent[index + 1].timestamp)).filter(seconds => seconds > 0 && seconds < 120);
    const gasUsed = recent.reduce((sum, block) => sum + block.weight, 0);
    return {
      blocks: recent,
      averageInterval: intervals.length ? Math.round(intervals.reduce((sum, seconds) => sum + seconds, 0) / intervals.length) : null,
      averageGasUsed: recent.length ? Math.round(gasUsed / recent.length) : 0,
      transactionCount: recent.reduce((sum, block) => sum + block.tx_count, 0),
      error: false,
    };
  }
}
