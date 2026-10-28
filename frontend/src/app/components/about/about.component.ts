import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@eth.about.title:About eth.tx.taxi`);
    this.seoService.setDescription($localize`:@@eth.meta.about.description:Learn about eth.tx.taxi, its Ethereum data sources, open-source lineage, and operator contact details.`);
  }
}
