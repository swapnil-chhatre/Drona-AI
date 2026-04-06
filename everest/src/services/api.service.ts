import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ResourceList } from '../interfaces/resource-list';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  discoverResources() {
    return this.http.get<ResourceList>(`${this.base}/api/discover`);
  }
}
