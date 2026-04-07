import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type UploadTone = 'indexed' | 'processing';
type LibraryView = 'grid' | 'list';
type NotificationTone = 'success' | 'error' | 'info';

interface UploadFileItem {
  id: string;
  title: string;
  typeIcon: string;
  typeTone: 'pdf' | 'doc' | 'link';
  date: string;
  statusLabel: string;
  tone: UploadTone;
  /** Blob URL for locally-uploaded files; null for pre-seeded/link items */
  fileUrl: string | null;
}

@Component({
  selector: 'app-upload-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-files.component.html',
  styleUrl: './upload-files.component.css',
})
export class UploadFilesComponent {
  protected readonly searchQuery = signal('');
  protected readonly selectedView = signal<LibraryView>('list');

  protected readonly notificationMessage = signal('');
  protected readonly notificationTone = signal<NotificationTone>('info');
  protected readonly showNotification = signal(false);

  protected readonly documents = signal<UploadFileItem[]>([
    {
      id: 'advanced-neurobiology',
      title: 'Advanced_Neurobiology_2024.pdf',
      typeIcon: 'picture_as_pdf',
      typeTone: 'pdf',
      date: 'Oct 12, 2023',
      statusLabel: 'Indexed',
      tone: 'indexed',
      fileUrl: null,
    },
    {
      id: 'quantum-physics-notes',
      title: 'Study_Notes_Quantum_Physics.docx',
      typeIcon: 'description',
      typeTone: 'doc',
      date: 'Oct 14, 2023',
      statusLabel: 'Processing',
      tone: 'processing',
      fileUrl: null,
    },
    {
      id: 'architecture-patterns-link',
      title: 'Wikipedia: Architecture_Patterns',
      typeIcon: 'link',
      typeTone: 'link',
      date: 'Oct 10, 2023',
      statusLabel: 'Indexed',
      tone: 'indexed',
      fileUrl: null,
    },
    {
      id: 'ethical-ai-framework',
      title: 'Ethical_AI_Framework_V2.pdf',
      typeIcon: 'picture_as_pdf',
      typeTone: 'pdf',
      date: 'Sep 28, 2023',
      statusLabel: 'Indexed',
      tone: 'indexed',
      fileUrl: null,
    },
  ]);

  private readonly maxFileSize = 2 * 1024 * 1024; // 2MB hard limit
  private readonly allowedExtensions = ['pdf', 'docx', 'txt'];

  protected readonly filteredDocuments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.documents();
    }

    return this.documents().filter((document) =>
      document.title.toLowerCase().includes(query)
    );
  });

  protected readonly activeProcessingDocument = computed(() =>
    this.documents().find((document) => document.tone === 'processing') ?? null
  );

  protected readonly indexedCount = computed(
    () => this.documents().filter((document) => document.tone === 'indexed').length
  );

  protected readonly processingCount = computed(
    () => this.documents().filter((document) => document.tone === 'processing').length
  );

  protected setView(view: LibraryView): void {
    this.selectedView.set(view);
  }

  protected viewDocument(doc: UploadFileItem): void {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      this.showToast('No preview available for pre-existing documents.', 'info');
    }
  }

  // protected deleteDocument(doc: UploadFileItem): void {
  //   const confirmed = window.confirm(`Delete "${doc.title}"? This cannot be undone.`);
  //   if (!confirmed) return;

  //   // Revoke the blob URL to free memory
  //   if (doc.fileUrl) {
  //     URL.revokeObjectURL(doc.fileUrl);
  //   }

  //   this.documents.set(this.documents().filter((d) => d.id !== doc.id));
  //   this.showToast(`"${doc.title}" has been removed.`, 'info');
  // }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    for (const file of files) {
      this.handleSingleFile(file);
    }

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

    for (const file of files) {
      this.handleSingleFile(file);
    }
  }

  protected dismissNotification(): void {
    this.showNotification.set(false);
    this.notificationMessage.set('');
  }

  private handleSingleFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !this.allowedExtensions.includes(extension)) {
      this.showToast('Only PDF, DOCX, and TXT files are allowed.', 'error');
      return;
    }

    if (file.size > this.maxFileSize) {
      this.showToast('File is too large. Max is 2MB.', 'error');
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    const newDocument: UploadFileItem = {
      id: this.createId(file.name),
      title: file.name,
      typeIcon: this.getTypeIcon(file.name),
      typeTone: this.getTypeTone(file.name),
      date: this.formatDate(new Date()),
      statusLabel: 'Processing',
      tone: 'processing',
      fileUrl,
    };

    this.documents.set([newDocument, ...this.documents()]);

    // Hardcoded fake indexing delay
    setTimeout(() => {
      this.markDocumentAsIndexed(newDocument.id);
      this.showToast('File successfully indexed in vector database.', 'success');
    }, 2000);
  }

  private markDocumentAsIndexed(documentId: string): void {
    this.documents.set(
      this.documents().map((document) =>
        document.id === documentId
          ? {
            ...document,
            statusLabel: 'Indexed',
            tone: 'indexed',
          }
          : document
      )
    );
  }

  private showToast(message: string, tone: NotificationTone): void {
    this.notificationMessage.set(message);
    this.notificationTone.set(tone);
    this.showNotification.set(true);

    setTimeout(() => {
      this.showNotification.set(false);
      this.notificationMessage.set('');
    }, 3000);
  }

  private getTypeIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'docx':
        return 'description';
      case 'txt':
        return 'article';
      default:
        return 'insert_drive_file';
    }
  }

  private getTypeTone(fileName: string): 'pdf' | 'doc' | 'link' {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'txt':
        return 'doc';
      default:
        return 'doc';
    }
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