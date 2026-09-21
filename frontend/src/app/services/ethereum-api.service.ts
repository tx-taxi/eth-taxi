import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EthereumAddressMetadata,
  EthereumPaginatedTransferResponse,
  EthereumPaginationParams,
  EthereumToken,
  EthereumTransactionMetadata,
} from '@interfaces/ethereum-api.interface';
import { StateService } from '@app/services/state.service';

@Injectable({
  providedIn: 'root'
})
export class EthereumApiService {
  private apiBaseUrl: string;
  private apiBasePath: string;

  constructor(
    private httpClient: HttpClient,
    private stateService: StateService,
  ) {
    this.apiBaseUrl = '';
    if (!stateService.isBrowser) {
      this.apiBaseUrl = this.stateService.env.NGINX_PROTOCOL + '://' + this.stateService.env.NGINX_HOSTNAME + ':' + this.stateService.env.NGINX_PORT;
    }

    this.apiBasePath = '';
    this.stateService.networkChanged$.subscribe((network) => {
      this.apiBasePath = network && network !== this.stateService.env.ROOT_NETWORK ? '/' + network : '';
    });
  }

  getAddress$(address: string): Observable<EthereumAddressMetadata> {
    return this.httpClient.get<EthereumAddressMetadata>(this.endpoint('address', address));
  }

  getToken$(address: string): Observable<EthereumToken> {
    return this.httpClient.get<EthereumToken>(this.endpoint('token', address));
  }

  getTokenTransfers$(address: string, pagination: EthereumPaginationParams = {}): Observable<EthereumPaginatedTransferResponse> {
    let params = new HttpParams();
    Object.entries(pagination).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.httpClient.get<EthereumPaginatedTransferResponse>(
      this.endpoint('token', address) + '/transfers',
      { params },
    );
  }

  getTransaction$(hash: string): Observable<EthereumTransactionMetadata> {
    return this.httpClient.get<EthereumTransactionMetadata>(this.endpoint('transaction', hash));
  }

  private endpoint(resource: 'address' | 'token' | 'transaction', identifier: string): string {
    return this.apiBaseUrl + this.apiBasePath + '/api/v1/ethereum/' + resource + '/' + encodeURIComponent(identifier);
  }
}
