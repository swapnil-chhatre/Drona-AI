import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type UploadTone = 'indexed' | 'processing';
type LibraryView = 'grid' | 'list';

interface UploadFileItem {
  id: string;
  title: string;
  typeIcon: string;
  typeTone: 'pdf' | 'doc' | 'link';
  date: string;
  statusLabel: string;
  tone: UploadTone;
}

@Component({
  selector: 'app-upload-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-files.component.html',
  styleUrl: './upload-files.component.css',
})
export class UploadFilesComponent {
  /** The current search term entered by the user */
  protected readonly searchQuery = signal('');
  
  /** Controls whether the library is displayed as a grid or a list */
  protected readonly selectedView = signal<LibraryView>('list');

  /** Mock data representing the user's document vault */
  protected readonly documents = signal<UploadFileItem[]>([
    {
      id: 'advanced-neurobiology',
      title: 'Advanced_Neurobiology_2024.pdf',
      typeIcon: 'picture_as_pdf',
      typeTone: 'pdf',
      date: 'Oct 12, 2023',
      statusLabel: 'Indexed',
      tone: 'indexed',
    },
    {
      id: 'quantum-physics-notes',
      title: 'Study_Notes_Quantum_Physics.docx',
      typeIcon: 'description',
      typeTone: 'doc',
      date: 'Oct 14, 2023',
      statusLabel: 'Processing',
      tone: 'processing',
    },
    {
      id: 'architecture-patterns-link',
      title: 'Wikipedia: Architecture_Patterns',
      typeIcon: 'link',
      typeTone: 'link',
      date: 'Oct 10, 2023',
      statusLabel: 'Indexed',
      tone: 'indexed',
    },
    {
      id: 'ethical-ai-framework',
      title: 'Ethical_AI_Framework_V2.pdf',
      typeIcon: 'picture_as_pdf',
      typeTone: 'pdf',
      date: 'Sep 28, 2023',
      statusLabel: 'Indexed',
      tone: 'indexed',
    },
  ]);

  // --- Upload State Signals ---
  /** Files currently selected or dropped by the user */
  protected readonly selectedFiles = signal<File[]>([]);
  /** Holds any validation error message from the upload process */
  protected readonly uploadError = signal('');
  /** Tracks whether a file is currently being dragged over the dropzone */
  protected readonly isDragging = signal(false);

  // Configuration thresholds
  private readonly maxFileSize = 50 * 1024 * 1024; // 50 MB
  private readonly allowedExtensions = ['pdf', 'docx', 'txt'];

  /**
   * Computes the subset of documents that match the search query.
   * If the search query is empty, it returns all documents.
   */
  protected readonly filteredDocuments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.documents();
    }

    return this.documents().filter((document) =>
      document.title.toLowerCase().includes(query)
    );
  });

  /** Retrieves the first document that is currently in 'processing' state */
  protected readonly activeProcessingDocument = computed(() =>
    this.documents().find((document) => document.tone === 'processing') ?? null
  );

  /** Number of fully indexed documents */
  protected readonly indexedCount = computed(
    () => this.documents().filter((document) => document.tone === 'indexed').length
  );

  /** Number of documents currently processing */
  protected readonly processingCount = computed(
    () => this.documents().filter((document) => document.tone === 'processing').length
  );

  /** Updates the view layout (list vs grid) */
  protected setView(view: LibraryView): void {
    this.selectedView.set(view);
  }

  /** Handles files explicitly selected via the hidden file input */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    this.handleFiles(files);

    // lets user pick the same file again if needed
    input.value = '';
  }

  /** Visual indicator handler for drag over events */
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  /** Resets visual indicator when drag leaves the component */
  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  /** Captures dropped files and processes them */
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!files.length) {
      return;
    }

    this.handleFiles(files);
  }

  /** Utility: removes a specific file from the selected files list */
  protected removeSelectedFile(fileToRemove: File): void {
    this.selectedFiles.set(
      this.selectedFiles().filter((file) => file !== fileToRemove)
    );
  }

  /** Utility: clears the entire currently selected files list and any errors */
  protected clearSelectedFiles(): void {
    this.selectedFiles.set([]);
    this.uploadError.set('');
  }

  /**
   * Validates ingested files and pushes valid ones to the list of documents 
   * as active 'processing' uploads.
   */
  private handleFiles(files: File[]): void {
    this.uploadError.set('');

    const validFiles: File[] = [];

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!extension || !this.allowedExtensions.includes(extension)) {
        this.uploadError.set('Only PDF, DOCX, and TXT files are allowed.');
        continue;
      }

      if (file.size > this.maxFileSize) {
        this.uploadError.set(`"${file.name}" exceeds the 50MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      return;
    }

    this.selectedFiles.set([...this.selectedFiles(), ...validFiles]);

    // Add uploaded files immediately into your document list as "Processing"
    const newItems: UploadFileItem[] = validFiles.map((file) => ({
      id: this.createId(file.name),
      title: file.name,
      typeIcon: this.getTypeIcon(file.name),
      typeTone: this.getTypeTone(file.name),
      date: this.formatDate(new Date()),
      statusLabel: 'Processing',
      tone: 'processing',
    }));

    this.documents.set([...newItems, ...this.documents()]);

    // If you want backend upload immediately, call this:
    // this.uploadFiles(validFiles);
  }

  /** 
   * Prepares valid files for transmission to backend endpoints. 
   * (Method scaffold for future API integration)
   */
  protected uploadFiles(files: File[]): void {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    // Example only:
    // inject HttpClient and use:
    // this.http.post('/api/upload', formData).subscribe(...)
  }

  /** Utility: Formats file sizes from bytes to readable strings. */
  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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