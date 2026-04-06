import { Injectable, signal } from '@angular/core';
import { GenerateRequest } from '../interfaces/generate-request';

@Injectable({ providedIn: 'root' })
export class PlanStateService {
  readonly request = signal<GenerateRequest | null>(null);

  set(request: GenerateRequest): void {
    this.request.set(request);
  }
}
