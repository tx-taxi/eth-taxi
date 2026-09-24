import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BlockExtended } from '@interfaces/node-api.interface';
import { StateService } from '@app/services/state.service';

type NetworkBarStatus = 'mined' | 'remaining';

interface NetworkBarShape {
  x: number;
  y: number;
  w: number;
  h: number;
  status: NetworkBarStatus;
}

interface EthereumNetworkStats {
  gasUtilization: number;
  latestBlockHeight: number;
  observedBlockTime: number;
  shapes: NetworkBarShape[];
}

const ETHEREUM_BLOCK_GAS_LIMIT = 60_000_000;
const NETWORK_BAR_WIDTH = 224;
const DEFAULT_BLOCK_TIME = 12;

@Component({
  selector: 'app-difficulty',
  templateUrl: './difficulty.component.html',
  styleUrls: ['./difficulty.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultyComponent implements OnInit {
  @Input() showTitle = true;

  networkStats$: Observable<EthereumNetworkStats | null>;
  mode: 'network' | 'rewards' = 'network';

  constructor(private stateService: StateService) { }

  ngOnInit(): void {
    this.networkStats$ = this.stateService.blocks$.pipe(
      map((blocks) => this.networkStats(blocks)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  setMode(mode: 'network' | 'rewards'): boolean {
    this.mode = mode;
    return false;
  }

  private networkStats(blocks: BlockExtended[]): EthereumNetworkStats | null {
    const recent = (blocks || [])
      .filter((block) => Number.isFinite(block?.height) && Number.isFinite(block?.timestamp))
      .sort((left, right) => left.height - right.height)
      .slice(-6);
    const latest = recent[recent.length - 1];
    if (!latest) {
      return null;
    }

    const intervals = recent.slice(1)
      .map((block, index) => block.timestamp - recent[index].timestamp)
      .filter((seconds) => seconds > 0 && seconds < 120);
    const observedBlockTime = intervals.length
      ? intervals.reduce((sum, seconds) => sum + seconds, 0) / intervals.length
      : DEFAULT_BLOCK_TIME;
    const gasUtilization = Math.max(0, Math.min(100, (latest.weight || 0) / ETHEREUM_BLOCK_GAS_LIMIT * 100));
    const filled = Math.round(NETWORK_BAR_WIDTH * gasUtilization / 100);

    return {
      gasUtilization,
      latestBlockHeight: latest.height,
      observedBlockTime,
      shapes: [
        ...(filled > 0 ? [{ x: 0, y: 0, w: filled, h: 9, status: 'mined' as const }] : []),
        ...(filled < NETWORK_BAR_WIDTH ? [{ x: filled, y: 0, w: NETWORK_BAR_WIDTH - filled, h: 9, status: 'remaining' as const }] : []),
      ],
    };
  }
}
