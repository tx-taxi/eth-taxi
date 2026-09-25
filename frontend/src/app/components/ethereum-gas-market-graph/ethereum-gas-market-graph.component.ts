import { formatDate, formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Input, LOCALE_ID, OnChanges } from '@angular/core';
import { EChartsOption } from '@app/graphs/echarts';

export interface EthereumGasMarketSample {
  added: number;
  base_fee_gwei: number;
  network_utilization_percentage: number;
  gas_price_average_gwei: number;
  pending_sample_count?: number;
}

type ChartSample = EthereumGasMarketSample & { timestamp: number };

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 60 * 1000;

@Component({
  selector: 'app-ethereum-gas-market-graph',
  templateUrl: './ethereum-gas-market-graph.component.html',
  styleUrls: ['./ethereum-gas-market-graph.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EthereumGasMarketGraphComponent implements OnChanges {
  @Input() samples: EthereumGasMarketSample[] | null = null;
  @Input() height = 260;

  readonly chartInitOptions = { renderer: 'svg' as const };

  chartOptions: EChartsOption = {};
  recentSamples: ChartSample[] = [];

  constructor(@Inject(LOCALE_ID) private readonly locale: string) {}

  ngOnChanges(): void {
    this.recentSamples = this.normalizeSamples(this.samples);
    this.chartOptions = this.recentSamples.length ? this.buildChartOptions() : {};
  }

  get emptyState(): string {
    if (this.samples === null) {
      return 'Loading gas market history';
    }

    return 'No gas market samples are available for the last two hours';
  }

  get accessibleSummary(): string {
    if (!this.recentSamples.length) {
      return this.emptyState;
    }

    const latest = this.recentSamples[this.recentSamples.length - 1];
    if (this.recentSamples.length === 1) {
      return `Current gas market sample at ${this.formatTime(latest.timestamp)}. `
        + `Base fee ${this.formatGwei(latest.base_fee_gwei)} gwei; `
        + `network utilization ${this.formatPercentage(latest.network_utilization_percentage)}.`;
    }

    return `Gas market history from ${this.formatTime(this.recentSamples[0].timestamp)} to ${this.formatTime(latest.timestamp)}. `
      + `Latest base fee ${this.formatGwei(latest.base_fee_gwei)} gwei; `
      + `network utilization ${this.formatPercentage(latest.network_utilization_percentage)}.`;
  }

  get historyLabel(): string {
    if (this.recentSamples.length === 1) {
      return 'Current sample';
    }

    if (this.recentSamples.length < 2) {
      return 'Live history';
    }
    const first = this.recentSamples[0].timestamp;
    const last = this.recentSamples[this.recentSamples.length - 1].timestamp;
    return last - first >= TWO_HOURS_MS - 60_000 ? 'Last 2 hours' : 'Live history';
  }

  private normalizeSamples(samples: EthereumGasMarketSample[] | null): ChartSample[] {
    if (!samples?.length) {
      return [];
    }

    const now = Date.now();
    const windowStart = now - TWO_HOURS_MS;
    const samplesByTimestamp = new Map<number, ChartSample>();

    for (const sample of samples) {
      const timestamp = sample.added * 1000;
      if (
        !Number.isFinite(timestamp)
        || timestamp < windowStart
        || timestamp > now + FUTURE_TOLERANCE_MS
        || !Number.isFinite(sample.base_fee_gwei)
        || sample.base_fee_gwei < 0
        || !Number.isFinite(sample.network_utilization_percentage)
        || sample.network_utilization_percentage < 0
        || sample.network_utilization_percentage > 100
        || !Number.isFinite(sample.gas_price_average_gwei)
        || sample.gas_price_average_gwei < 0
      ) {
        continue;
      }

      samplesByTimestamp.set(timestamp, { ...sample, timestamp });
    }

    return Array.from(samplesByTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  private buildChartOptions(): EChartsOption {
    const sampleByTimestamp = new Map(this.recentSamples.map(sample => [sample.timestamp, sample]));
    const isCurrentSample = this.recentSamples.length === 1;
    const currentTimestamp = this.recentSamples[0]?.timestamp || Date.now();

    return {
      animation: false,
      grid: {
        top: 12,
        right: 44,
        bottom: 32,
        left: 44,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: 'var(--box-bg)',
        borderColor: 'var(--border-subtle)',
        borderWidth: 1,
        textStyle: {
          color: 'var(--fg)',
          fontSize: 12,
        },
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'var(--transparent-fg)',
            type: 'dashed',
          },
        },
        formatter: (params: unknown): string => {
          const points = Array.isArray(params) ? params as Array<{ value?: [number, number] }> : [];
          const timestamp = Number(points[0]?.value?.[0]);
          const sample = sampleByTimestamp.get(timestamp);
          if (!sample) {
            return '';
          }

          const pendingCount = Number.isFinite(sample.pending_sample_count)
            ? `<div>Pending txs sampled: <strong>${formatNumber(sample.pending_sample_count as number, this.locale, '1.0-0')}</strong></div>`
            : '';

          return `<div class="ethereum-gas-tooltip">
            <div><strong>${formatDate(timestamp, 'mediumTime', this.locale)}</strong></div>
            <div>Base fee: <strong>${this.formatGwei(sample.base_fee_gwei)} gwei</strong></div>
            <div>Network utilization: <strong>${this.formatPercentage(sample.network_utilization_percentage)}</strong></div>
            <div>Average gas price: <strong>${this.formatGwei(sample.gas_price_average_gwei)} gwei</strong></div>
            ${pendingCount}
          </div>`;
        },
      },
      xAxis: {
        type: 'time',
        min: isCurrentSample ? currentTimestamp - 5 * 60 * 1000 : 'dataMin',
        max: isCurrentSample ? currentTimestamp + 5 * 60 * 1000 : 'dataMax',
        boundaryGap: false,
        splitNumber: 3,
        axisLine: {
          lineStyle: { color: 'var(--transparent-fg)' },
        },
        axisTick: { show: false },
        axisLabel: {
          color: 'var(--transparent-fg)',
          hideOverlap: true,
          showMinLabel: true,
          showMaxLabel: true,
          formatter: (value: number): string => this.formatAxisTime(value),
        },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          min: 0,
          axisLabel: {
            color: 'var(--transparent-fg)',
            formatter: (value: number): string => this.formatCompact(value),
          },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: {
            lineStyle: {
              color: 'var(--transparent-fg)',
              opacity: 0.16,
              type: 'dotted',
            },
          },
        },
        {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            color: 'var(--transparent-fg)',
            formatter: (value: number): string => `${formatNumber(value, this.locale, '1.0-0')}%`,
          },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Base fee',
          type: 'line',
          yAxisIndex: 0,
          data: this.recentSamples.map(sample => [sample.timestamp, sample.base_fee_gwei]),
          showSymbol: isCurrentSample,
          symbol: 'circle',
          symbolSize: isCurrentSample ? 9 : 4,
          smooth: false,
          lineStyle: {
            color: 'var(--primary)',
            width: 2.5,
          },
          itemStyle: { color: 'var(--primary)' },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Network utilization',
          type: 'line',
          yAxisIndex: 1,
          data: this.recentSamples.map(sample => [sample.timestamp, sample.network_utilization_percentage]),
          showSymbol: isCurrentSample,
          symbol: 'diamond',
          symbolSize: isCurrentSample ? 9 : 4,
          smooth: false,
          lineStyle: {
            color: 'var(--eth-utilization)',
            type: 'dashed',
            width: 2,
          },
          itemStyle: { color: 'var(--eth-utilization)' },
          areaStyle: {
            color: 'var(--eth-utilization)',
            opacity: 0.1,
          },
          emphasis: { focus: 'series' },
        },
      ],
    };
  }

  private formatTime(timestamp: number): string {
    return formatDate(timestamp, 'shortTime', this.locale);
  }

  private formatAxisTime(timestamp: number): string {
    const first = this.recentSamples[0]?.timestamp || timestamp;
    const last = this.recentSamples[this.recentSamples.length - 1]?.timestamp || timestamp;
    const span = last - first;
    if (span < 5 * 60 * 1000) {
      const edgeTolerance = Math.max(1_000, span * 0.06);
      if (Math.abs(timestamp - first) > edgeTolerance && Math.abs(timestamp - last) > edgeTolerance) {
        return '';
      }
      return formatDate(timestamp, 'mediumTime', this.locale);
    }
    return formatDate(timestamp, 'shortTime', this.locale);
  }

  private formatGwei(value: number): string {
    const digits = value < 1 ? '1.0-4' : value < 100 ? '1.0-2' : '1.0-0';
    return formatNumber(value, this.locale, digits);
  }

  private formatPercentage(value: number): string {
    return `${formatNumber(value, this.locale, '1.0-1')}%`;
  }

  private formatCompact(value: number): string {
    if (value < 1) {
      return formatNumber(value, this.locale, '1.0-3');
    }
    if (value >= 1000) {
      return `${formatNumber(value / 1000, this.locale, '1.0-1')}k`;
    }
    return formatNumber(value, this.locale, value < 10 ? '1.0-1' : '1.0-0');
  }
}
