import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Transaction } from '@interfaces/electrs.interface';
import { AssetFlow } from '@components/tx-bowtie-graph/tx-bowtie-graph.component';

export type AccountStateBadgeTone = 'contract' | 'neutral' | 'verified' | 'warning';

export interface AccountStateBadge {
  label: string;
  tone: AccountStateBadgeTone;
}

export interface AccountStateActor {
  id: string;
  label: string;
  address?: string | null;
  detail?: string | null;
  href?: string | null;
  iconUrl?: string | null;
  badges?: AccountStateBadge[];
}

export interface AccountStateAsset {
  id: string;
  label: string;
  symbol?: string | null;
  href?: string | null;
  iconUrl?: string | null;
  accent?: string | null;
}

export type AccountStateStepKind = 'call' | 'confirmation' | 'deployment' | 'event' | 'transfer';

export interface AccountStateFlowStep {
  id: string;
  label: string;
  detail?: string | null;
  href?: string | null;
  accent?: string | null;
  kind: AccountStateStepKind;
}

export type AccountStateChangeKind = 'execution' | 'fee' | 'nonce' | 'transfer' | 'value';

export interface AccountStateChange {
  id: string;
  actor: AccountStateActor;
  counterpart?: AccountStateActor | null;
  label: string;
  detail?: string | null;
  value?: string | null;
  asset?: AccountStateAsset | null;
  accent?: string | null;
  kind: AccountStateChangeKind;
}

@Component({
  selector: 'app-account-state-flow',
  templateUrl: './account-state-flow.component.html',
  styleUrls: ['./account-state-flow.component.scss'],
  standalone: false,
})
export class AccountStateFlowComponent implements OnChanges {
  @Input() tx: Transaction;
  @Input() network = '';
  @Input() isMobile = false;
  @Input() source: AccountStateActor | null = null;
  @Input() target: AccountStateActor | null = null;
  @Input() sourceLabel = 'Initiator';
  @Input() targetLabel = 'Execution target';
  @Input() steps: AccountStateFlowStep[] = [];
  @Input() changes: AccountStateChange[] = [];
  @Input() assetFlows: AssetFlow[] = [];
  @Input() stateNotice: string | null = null;
  @Input() visibleChangeLimit = 6;

  showAllChanges = false;
  private readonly failedImageIds = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['changes'] && !changes['changes'].firstChange) {
      this.showAllChanges = false;
    }
  }

  get visibleChanges(): AccountStateChange[] {
    return this.showAllChanges ? this.changes : this.changes.slice(0, this.visibleChangeLimit);
  }

  get hiddenChangeCount(): number {
    return Math.max(0, this.changes.length - this.visibleChangeLimit);
  }

  get graphWidth(): number {
    return this.isMobile ? 320 : 960;
  }

  get graphHeight(): number {
    const strandHeight = this.isMobile ? 20 : 16;
    return Math.min(this.isMobile ? 220 : 180, Math.max(64, (this.assetFlows.length * strandHeight) + 32));
  }

  get graphMaxCombinedWeight(): number {
    return Math.min(84, Math.max(20, this.assetFlows.length * 9));
  }

  imageFailed(actor: AccountStateActor | AccountStateAsset): boolean {
    return this.failedImageIds.has(actor.id || actor.label);
  }

  onImageError(actor: AccountStateActor | AccountStateAsset): void {
    this.failedImageIds.add(actor.id || actor.label);
  }

  initials(actor: AccountStateActor | AccountStateAsset): string {
    const symbol = 'symbol' in actor ? actor.symbol : null;
    const address = 'address' in actor ? actor.address : null;
    if (!symbol && address?.toLowerCase().startsWith('0x')) {
      return '0x';
    }
    const source = symbol || actor.label || address || '??';
    const words = source.match(/[a-zA-Z0-9]+/g) || [];
    if (words.length > 1) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }

  trackStep(_: number, step: AccountStateFlowStep): string {
    return step.id;
  }

  trackChange(_: number, change: AccountStateChange): string {
    return change.id;
  }

  toggleChanges(): void {
    this.showAllChanges = !this.showAllChanges;
  }
}
