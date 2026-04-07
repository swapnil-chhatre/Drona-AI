import { Injectable, signal } from '@angular/core';
import { DiscoverRequest } from '../interfaces/discover-request';

@Injectable({ providedIn: 'root' })
export class DiscoverStateService {
  readonly request = signal<DiscoverRequest | null>(null);

  set(request: DiscoverRequest): void {
    this.request.set(request);
  }
}
