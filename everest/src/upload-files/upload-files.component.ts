import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../common/sidebar/sidebar.component';

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
  imports: [FormsModule, SidebarComponent],
  templateUrl: './upload-files.component.html',
  styleUrl: './upload-files.component.css',
})
export class UploadFilesComponent {
  protected readonly searchQuery = signal('');
  protected readonly selectedView = signal<LibraryView>('list');

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

  protected readonly filteredDocuments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.documents();
    }

    return this.documents().filter((document) => document.title.toLowerCase().includes(query));
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

  // protected overallProgress(document: UploadFileItem): number {
  //   const total = document.stages.reduce((sum, stage) => sum + stage.progress, 0);
  //   return Math.round(total / document.stages.length);
  // }

  // protected stageStateClass(stage: UploadStage): 'done' | 'active' | 'pending' {
  //   if (stage.progress >= 100) {
  //     return 'done';
  //   }

  //   if (stage.progress > 0) {
  //     return 'active';
  //   }

  //   return 'pending';
  // }
}
