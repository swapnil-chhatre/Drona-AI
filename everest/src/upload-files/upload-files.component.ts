import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadResponse, UploadService, UploadedFile } from '../services/upload.service';

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
export class UploadFilesComponent implements OnInit, OnDestroy {
  private readonly uploadService = inject(UploadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly maxFileSize = 0.5 * 1024 * 1024;
  private readonly allowedExtensions = ['pdf', 'txt'];

  protected readonly searchQuery = signal('');
  protected readonly documents = signal<UploadFileItem[]>([]);

  protected readonly filteredDocuments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.documents();
    }

    return this.documents().filter((document) =>
      document.title.toLowerCase().includes(query),
    );
  });

  protected readonly indexedCount = computed(
    () =>
      this.documents().filter((document) => document.tone === 'indexed').length,
  );

  protected readonly processingCount = computed(
    () =>
      this.documents().filter((document) => document.tone === 'processing')
        .length,
  );

  protected readonly hasDocuments = computed(
    () => this.filteredDocuments().length > 0,
  );

  ngOnInit(): void {
    this.loadUploadedFiles();
  }

  ngOnDestroy(): void {
    for (const document of this.documents()) {
      if (document.fileUrl) {
        URL.revokeObjectURL(document.fileUrl);
      }
    }
  }

  protected viewDocument(document: UploadFileItem): void {
    if (!document.fileUrl) {
      this.showToast(
        'Preview is only available for files uploaded in this session.',
        'info',
      );
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

  private handleFiles(files: File[]): void {
    for (const file of files) {
      this.handleSingleFile(file);
    }
  }

  private handleSingleFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !this.allowedExtensions.includes(extension)) {
      this.showToast(
        'Only PDF and TXT files are supported right now.',
        'error',
      );
      return;
    }

    if (file.size > this.maxFileSize) {
      this.showToast(
        `"${file.name}" is larger than 0.5MB. Try again with a smaller file.`,
        'error',
      );
      return;
    }

    const localId = this.createId(file.name);
    const newDocument: UploadFileItem = {
      id: localId,
      title: file.name,
      typeIcon: this.getTypeIcon(file.name),
      typeTone: this.getTypeTone(file.name),
      date: this.formatDate(new Date()),
      statusLabel: 'Uploading',
      tone: 'processing',
      fileUrl: URL.createObjectURL(file),
      documentId: null,
    };

    this.documents.set(this.sortAlpha([newDocument, ...this.documents()]));

    this.uploadService.uploadFile(file).subscribe({
      next: (response: UploadResponse) => {
        this.markDocumentAsUploaded(
          localId,
          response.document_id,
          response.filename,
          response.is_duplicate,
        );

        if (response.is_duplicate) {
          this.showToast(
            `"${response.filename}" already exists in your library.`,
            'info',
          );
        } else {
          this.showToast(
            `"${response.filename}" uploaded successfully.`,
            'success',
          );
        }
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

  private loadUploadedFiles(): void {
    this.uploadService.getUploadedFiles().subscribe({
      next: (files: UploadedFile[]) => {
        const mappedDocs: UploadFileItem[] = files.map((file) => ({
          id: file.id,
          title: file.filename,
          typeIcon: this.getTypeIcon(file.filename),
          typeTone: this.getTypeTone(file.filename),
          date: file.created_at
            ? this.formatDate(new Date(file.created_at))
            : 'Unknown',
          statusLabel: 'Indexed',
          tone: 'indexed',
          fileUrl: null,
          documentId: file.id,
        }));
        this.documents.set(this.sortAlpha(mappedDocs));
      },
      error: (err) => {
        console.error('Error loading uploaded files:', err);
        this.showToast('Failed to load existing documents.', 'error');
      },
    });
  }

  private markDocumentAsUploaded(
    localId: string,
    documentId: string,
    filename: string,
    isDuplicate: boolean = false,
  ): void {
    this.documents.set(
      this.sortAlpha(
        this.documents().map((document) =>
          document.id === localId
            ? {
                ...document,
                title: filename,
                documentId,
                statusLabel: isDuplicate ? 'Already exists' : 'Uploaded',
                tone: 'indexed',
              }
            : document,
        ),
      ),
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
              statusLabel: 'Upload failed',
              tone: 'processing',
            }
          : document,
      ),
    );
  }

  private showToast(message: string, tone: NotificationTone): void {
    this.snackBar.open(message, 'Dismiss', {
      panelClass: [`snack-${tone}`],
    });
  }

  private sortAlpha(docs: UploadFileItem[]): UploadFileItem[] {
    return [...docs].sort((a, b) => a.title.localeCompare(b.title));
  }

  private getTypeIcon(fileName: string): string {
    return fileName.toLowerCase().endsWith('.pdf')
      ? 'picture_as_pdf'
      : 'description';
  }

  private getTypeTone(fileName: string): DocumentTone {
    return fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'doc';
  }

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
