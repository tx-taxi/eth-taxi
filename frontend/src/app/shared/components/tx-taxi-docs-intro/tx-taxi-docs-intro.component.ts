import { ChangeDetectionStrategy, Component, Inject, Input, LOCALE_ID } from '@angular/core';

@Component({
  selector: 'app-tx-taxi-docs-intro',
  standalone: true,
  templateUrl: './tx-taxi-docs-intro.component.html',
  styleUrls: ['./tx-taxi-docs-intro.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TxTaxiDocsIntroComponent {
  @Input() context = 'documentation';
  @Input() chainName = '';
  @Input() chainHost = '';

  constructor(@Inject(LOCALE_ID) private locale: string) {}

  get explorerHome(): string { return this.locale.toLowerCase().startsWith('es') ? '/es/' : '/'; }

  get contextLabel(): string {
    return this.context === 'explorer'
      ? $localize`:@@eth.intro.explorer:explorer`
      : $localize`:@@eth.intro.documentation:documentation`;
  }
}
