import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

interface UploadApiResponse {
  document_id: string;
  filename: string | null;
  status: 'success';
  is_duplicate?: boolean;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  status: 'success';
  is_duplicate: boolean;
}

export interface UploadedFile {
  id: string;
  filename: string;
  file_size: number;
  created_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/upload`;

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.set('file', file, file.name);

    return this.http.post<UploadApiResponse>(this.apiUrl, formData).pipe(
      map((response) => ({
        document_id: response.document_id,
        filename: response.filename ?? file.name,
        status: response.status,
        is_duplicate: response.is_duplicate ?? false,
      }))
    );
  }

  getUploadedFiles(): Observable<UploadedFile[]> {
    return this.http.get<UploadedFile[]>(this.apiUrl);
  }
}
