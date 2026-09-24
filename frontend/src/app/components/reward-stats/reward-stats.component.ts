import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BlockExtended } from '@interfaces/node-api.interface';
import { StateService } from '@app/services/state.service';

interface EthereumRewardStats {
  proposerRewards: number;
  feePerBlock: number;
  feePerTx: number;
}

const REWARD_SAMPLE_BLOCKS = 6;

@Component({
  selector: 'app-reward-stats',
  templateUrl: './reward-stats.component.html',
  styleUrls: ['./reward-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class RewardStatsComponent implements OnInit {
  public $rewardStats: Observable<EthereumRewardStats | null>;

  constructor(private stateService: StateService) { }

  ngOnInit(): void {
    this.$rewardStats = this.stateService.blocks$.pipe(
      map((blocks) => this.rewardStats(blocks)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private rewardStats(blocks: BlockExtended[]): EthereumRewardStats | null {
    const recent = (blocks || [])
      .filter((block) => Number.isFinite(block?.height))
      .sort((left, right) => left.height - right.height)
      .slice(-REWARD_SAMPLE_BLOCKS);
    if (!recent.length) {
      return null;
    }

    const totalFees = recent.reduce((sum, block) => sum + Number(block.extras?.totalFees || 0), 0);
    const proposerRewards = recent.reduce((sum, block) => sum + Number(block.extras?.reward || 0), 0);
    const transactions = recent.reduce((sum, block) => sum + Number(block.tx_count || 0), 0);

    return {
      proposerRewards,
      feePerBlock: totalFees / recent.length,
      feePerTx: transactions ? totalFees / transactions : 0,
    };
  }
}
