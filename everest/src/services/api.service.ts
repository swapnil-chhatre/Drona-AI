import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ResourceList } from '../interfaces/resource-list';
import { DiscoverRequest } from '../interfaces/discover-request';
import { GenerateRequest } from '../interfaces/generate-request';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  uploadPdf(blob: Blob): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', blob, 'study-plan.pdf');
    return this.http.post<{ url: string }>(`${this.base}/api/pdf/upload`, form);
  }

  discoverResources(request: DiscoverRequest) {
    return this.http.post<ResourceList>(`${this.base}/api/discover`, request);
  }

  getSuggestions(grade: string, subject: string) {
    return this.http.get<{ grades: string[]; subjects: string[]; suggestions: string[] }>(
      `${this.base}/api/suggestions`,
      { params: { grade, subject } }
    );
  }

  // SSE with POST requires fetch — HttpClient doesn't support streaming responses.
  streamStudyPlan(request: GenerateRequest): Observable<string> {
    return new Observable(observer => {
      const controller = new AbortController();

      fetch(`${this.base}/api/generate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(response => {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }

              const text = decoder.decode(value, { stream: true });
              for (const line of text.split('\n')) {
                if (line.startsWith('event: done')) {
                  observer.complete();
                  return;
                }
                if (line.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token !== undefined) observer.next(parsed.token);
                  } catch { /* partial chunk — ignore */ }
                }
              }
              read();
            }).catch(err => observer.error(err));
          };
          read();
        })
        .catch(err => observer.error(err));

      // Cancel the fetch if the Observable is unsubscribed
      return () => controller.abort();
    });
  }

  streamQuiz(request: GenerateRequest): Observable<string> {
    return new Observable(observer => {
      const controller = new AbortController();

      fetch(`${this.base}/api/generate/quiz/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(response => {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }

              const text = decoder.decode(value, { stream: true });
              for (const line of text.split('\n')) {
                if (line.startsWith('event: done')) {
                  observer.complete();
                  return;
                }
                if (line.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token !== undefined) observer.next(parsed.token);
                  } catch { /* partial chunk — ignore */ }
                }
              }
              read();
            }).catch(err => observer.error(err));
          };
          read();
        })
        .catch(err => observer.error(err));

      // Cancel the fetch if the Observable is unsubscribed
      return () => controller.abort();
    });
  }

  streamActivities(request: GenerateRequest): Observable<string> {
    return new Observable(observer => {
      const controller = new AbortController();

      fetch(`${this.base}/api/generate/activities/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(response => {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }

              const text = decoder.decode(value, { stream: true });
              for (const line of text.split('\n')) {
                if (line.startsWith('event: done')) {
                  observer.complete();
                  return;
                }
                if (line.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token !== undefined) observer.next(parsed.token);
                  } catch { /* partial chunk — ignore */ }
                }
              }
              read();
            }).catch(err => observer.error(err));
          };
          read();
        })
        .catch(err => observer.error(err));

      return () => controller.abort();
    });
  }

  streamKeywords(request: GenerateRequest): Observable<string> {
    return new Observable(observer => {
      const controller = new AbortController();

      fetch(`${this.base}/api/generate/keywords/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
        .then(response => {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) { observer.complete(); return; }

              const text = decoder.decode(value, { stream: true });
              for (const line of text.split('\n')) {
                if (line.startsWith('event: done')) {
                  observer.complete();
                  return;
                }
                if (line.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.token !== undefined) observer.next(parsed.token);
                  } catch { /* partial chunk — ignore */ }
                }
              }
              read();
            }).catch(err => observer.error(err));
          };
          read();
        })
        .catch(err => observer.error(err));

      return () => controller.abort();
    });
  }
}
