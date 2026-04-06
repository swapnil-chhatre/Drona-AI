import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ResourceList } from '../interfaces/resource-list';
import { DiscoverRequest } from '../interfaces/discover-request';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  discoverResources(request: DiscoverRequest) {
    return this.http.post<ResourceList>(`${this.base}/api/discover`, request);
  }
}
