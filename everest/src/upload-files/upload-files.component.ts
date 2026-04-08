import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmbeddingStatus, UploadResponse, UploadService } from '../services/upload.service';

type UploadTone = 'indexed' | 'processing';
type NotificationTone = 'success' | 'error' | 'info';
type DocumentTone = 'pdf' | 'doc';

interface UploadFileItem {
  id: string;
  title: string;
  typeIcon: string;
  typeTone: DocumentTone;
  date: string;
  statusLabel: string;
  embeddingStatus: EmbeddingStatus | null;
  tone: UploadTone;
  fileUrl: string | null;
  documentId: string | null;
}

@Component({
  selector: 'app-upload-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-files.component.html',
  styleUrl: './upload-files.component.css',
})
export class UploadFilesComponent implements OnDestroy {
  private readonly uploadService = inject(UploadService);
  private readonly maxFileSize = 2 * 1024 * 1024;
  private readonly allowedExtensions = ['pdf', 'docx', 'txt'];
  private notificationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly searchQuery = signal('');
  protected readonly notificationMessage = signal('');
  protected readonly notificationTone = signal<NotificationTone>('info');
  protected readonly showNotification = signal(false);
  protected readonly documents = signal<UploadFileItem[]>([]);

  protected readonly filteredDocuments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.documents();
    }

    return this.documents().filter((document) =>
      document.title.toLowerCase().includes(query)
    );
  });

  protected readonly indexedCount = computed(
    () => this.documents().filter((document) => document.tone === 'indexed').length
  );

  protected readonly processingCount = computed(
    () => this.documents().filter((document) => document.tone === 'processing').length
  );

  protected readonly hasDocuments = computed(() => this.filteredDocuments().length > 0);

  ngOnDestroy(): void {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }

    for (const document of this.documents()) {
      if (document.fileUrl) {
        URL.revokeObjectURL(document.fileUrl);
      }
    }
  }

  protected viewDocument(document: UploadFileItem): void {
    if (!document.fileUrl) {
      this.showToast('Preview is only available for files uploaded in this session.', 'info');
      return;
    }

    window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.handleFiles(Array.from(input.files));
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer?.files ?? []);

    if (!files.length) {
      return;
    }

    this.handleFiles(files);
  }

  protected dismissNotification(): void {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
      this.notificationTimeoutId = null;
    }

    this.showNotification.set(false);
    this.notificationMessage.set('');
  }

  private handleFiles(files: File[]): void {
    for (const file of files) {
      this.handleSingleFile(file);
    }
  }

  private handleSingleFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !this.allowedExtensions.includes(extension)) {
      this.showToast('Only PDF, DOCX, and TXT files are supported right now.', 'error');
      return;
    }

    if (file.size > this.maxFileSize) {
      this.showToast(`"${file.name}" is larger than 2MB. Try again with a smaller file.`, 'error');
      return;
    }

    const localId = this.createId(file.name);
    const newDocument: UploadFileItem = {
      id: localId,
      title: file.name,
      typeIcon: this.getTypeIcon(file.name),
      typeTone: this.getTypeTone(file.name),
      date: this.formatDate(new Date()),
      statusLabel: 'Uploading and indexing',
      embeddingStatus: null,
      tone: 'processing',
      fileUrl: URL.createObjectURL(file),
      documentId: null,
    };

    this.documents.set([newDocument, ...this.documents()]);
    this.showToast(`Uploading "${file.name}" and generating embeddings...`, 'info');

    this.uploadService.uploadFile(file).subscribe({
      next: (response: UploadResponse) => {
        this.markDocumentAsIndexed(
          localId,
          response.document_id,
          response.filename,
          response.embedding_status
        );
        this.showToast(
          `"${response.filename}" uploaded successfully. Embedding status: ${response.embedding_status}.`,
          'success'
        );
      },
      error: (error) => {
        this.markDocumentAsFailed(localId);

        const backendMessage =
          (typeof error?.error?.detail === 'string' && error.error.detail) ||
          'Upload failed. Please try again.';

        this.showToast(backendMessage, 'error');
      },
    });
  }

  private markDocumentAsIndexed(
    localId: string,
    documentId: string,
    filename: string,
    embeddingStatus: EmbeddingStatus
  ): void {
    this.documents.set(
      this.documents().map((document) =>
        document.id === localId
          ? {
              ...document,
              title: filename,
              documentId,
              embeddingStatus,
              statusLabel: this.getIndexedStatusLabel(embeddingStatus),
              tone: 'indexed',
            }
          : document
      )
    );
  }

  private removeDocument(localId: string): void {
    const document = this.documents().find((item) => item.id === localId);

    if (document?.fileUrl) {
      URL.revokeObjectURL(document.fileUrl);
    }

    this.documents.set(this.documents().filter((item) => item.id !== localId));
  }

  private markDocumentAsFailed(localId: string): void {
    this.documents.set(
      this.documents().map((document) =>
        document.id === localId
          ? {
              ...document,
              embeddingStatus: null,
              statusLabel: 'Upload failed',
              tone: 'processing',
            }
          : document
      )
    );
  }

  private showToast(message: string, tone: NotificationTone): void {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }

    this.notificationMessage.set(message);
    this.notificationTone.set(tone);
    this.showNotification.set(true);

    this.notificationTimeoutId = setTimeout(() => {
      this.showNotification.set(false);
      this.notificationMessage.set('');
      this.notificationTimeoutId = null;
    }, 3000);
  }

  private getTypeIcon(fileName: string): string {
    return fileName.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description';
  }

  private getTypeTone(fileName: string): DocumentTone {
    return fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'doc';
  }

  private getIndexedStatusLabel(embeddingStatus: EmbeddingStatus): string {
    return embeddingStatus === 'done' ? 'Embedded and ready' : 'Indexed';
  }

  // protected deleteDocument(document: UploadFileItem): void {
  //   // Keep delete functionality disabled until the backend delete endpoint exists.
  // }

  private createId(fileName: string): string {
    return `${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }
}
