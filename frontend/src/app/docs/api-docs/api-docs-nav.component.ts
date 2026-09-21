import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  EthereumDocItem,
  ethereumGuideData,
  ethereumRestData,
  ethereumWebsocketData,
} from '@app/docs/api-docs/ethereum-docs-data';

@Component({
  selector: 'app-api-docs-nav',
  templateUrl: './api-docs-nav.component.html',
  styleUrls: ['./api-docs-nav.component.scss'],
  standalone: false,
})
export class ApiDocsNavComponent implements OnInit {
  @Input() whichTab: 'faq' | 'rest' | 'websocket';
  @Output() navLinkClickEvent = new EventEmitter<{ event: Event; fragment: string }>();

  tabData: EthereumDocItem[] = [];

  ngOnInit(): void {
    this.tabData = this.whichTab === 'rest'
      ? ethereumRestData
      : this.whichTab === 'websocket'
        ? ethereumWebsocketData
        : ethereumGuideData;
  }

  navLinkClick(event: Event, fragment: string): void {
    event.preventDefault();
    this.navLinkClickEvent.emit({ event, fragment });
  }
}
