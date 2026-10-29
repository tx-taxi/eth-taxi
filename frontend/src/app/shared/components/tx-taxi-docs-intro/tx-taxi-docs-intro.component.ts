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

  get explorerHome(): string {
    const locale = this.locale.toLowerCase().split('-')[0];
    return ['es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ko', 'uk', 'vi'].includes(locale) ? `/${locale}/` : '/';
  }

  get explorerAriaLabel(): string {
    return $localize`:@@eth.intro.openHost:Open` + ' ' + this.chainHost;
  }

  get contextLabel(): string {
    return this.context === 'explorer'
      ? $localize`:@@eth.intro.explorer:explorer`
      : $localize`:@@eth.intro.documentation:documentation`;
  }
}
