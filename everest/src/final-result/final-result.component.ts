import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { QRCodeComponent } from 'angularx-qrcode';
import { ApiService } from '../services/api.service';
import { Router, RouterLink } from '@angular/router';
import { MatButtonToggle, MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { PlanStateService } from '../services/plan-state.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { FinalResultDocument } from '../interfaces/final-result';

@Component({
  selector: 'app-final-result',
  standalone: true,
  imports: [MarkdownComponent, RouterLink, MatButtonToggle, MatButtonToggleModule, QRCodeComponent],
  templateUrl: './final-result.component.html',
  styleUrl: './final-result.component.css',
})
export class FinalResultComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly planState = inject(PlanStateService);
  private planStreamSub: Subscription | null = null;
  private quizStreamSub: Subscription | null = null;
  private activitiesStreamSub: Subscription | null = null;
  private keywordsStreamSub: Subscription | null = null;

  protected readonly request = this.planState.request;
  protected readonly copyLabel = signal('Copy');

  protected readonly activeDocumentId = signal('study-plan');

  protected readonly actionCards = signal<FinalResultDocument[]>([
    {
      id: 'study-plan',
      label: 'Study Plan',
      icon: 'menu_book',
      tone: 'primary',
      markdown: '',
      type: 'plan',
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: 'quiz',
      tone: 'tertiary',
      markdown: '',
      type: 'quiz',
      level: '',
    },
    {
      id: 'keywords',
      label: 'Keywords',
      icon: 'translate',
      tone: 'secondary',
      markdown: '',
      type: 'plan',
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: 'groups',
      tone: 'primary',
      markdown: '',
      type: 'activities',
      level: '',
    },
  ]);

  protected readonly testType = signal<'quiz' | 'activities'>('quiz');
  protected readonly testTypeSelected = signal(false);

  protected selectTestType(type: string): void {
    if (type === 'quiz' || type === 'activities') {
      this.testType.set(type);
      this.testTypeSelected.set(true);
      this.activeDocumentId.set(type);
    }
  }

  protected onDifficultyChange(event: MatButtonToggleChange): void {
    this.actionCards.update(cards => cards.map(card => {
      if (card.type === this.testType()) {
        card.level = event.value;
        this.request()!.level = event.value;
      }
      return card;
    }));
  }

  protected readonly currentTestLevel = computed(() => {
    const type = this.testType();
    return this.actionCards().find(c => c.type === type)?.level ?? null;
  });

  protected readonly activeDocument = computed(() => {
    return (
      this.actionCards().find((doc) => doc.id === this.activeDocumentId()) ??
      this.actionCards()[0]
    );
  });

  protected readonly displayMarkdown = computed(() => {
    const active = this.activeDocument();
    if (!active.markdown) {
      return `# ${active.label}\n\n*Initializing your customized ${active.label.toLowerCase()}...*`;
    }
    return active.markdown;
  });

  protected readonly isStreaming = computed(() => {
    const activeId = this.activeDocumentId();
    if (activeId === 'study-plan') return !!this.planStreamSub;
    if (activeId === 'quiz') return !!this.quizStreamSub;
    if (activeId === 'activities') return !!this.activitiesStreamSub;
    if (activeId === 'keywords') return !!this.keywordsStreamSub;
    return false;
  });

  protected readonly isDone = computed(() => {
    const activeId = this.activeDocumentId();
    const activeDoc = this.activeDocument();
    
    let isSubscribed = false;
    if (activeId === 'study-plan') isSubscribed = !!this.planStreamSub;
    else if (activeId === 'quiz') isSubscribed = !!this.quizStreamSub;
    else if (activeId === 'activities') isSubscribed = !!this.activitiesStreamSub;
    else if (activeId === 'keywords') isSubscribed = !!this.keywordsStreamSub;

    return !isSubscribed && !!activeDoc.markdown;
  });

  ngOnInit(): void {
    if (!this.request()) {
      void this.router.navigate(['/']);
      return;
    }
    this.startPlanStream();
  }

  ngOnDestroy(): void {
    this.planStreamSub?.unsubscribe();
    this.quizStreamSub?.unsubscribe();
    this.activitiesStreamSub?.unsubscribe();
    this.keywordsStreamSub?.unsubscribe();
    const url = this.pdfBlobUrl();
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  protected selectDocument(documentId: string): void {
    this.activeDocumentId.set(documentId);
    this.copyLabel.set('Copy');

    const card = this.actionCards().find((c) => c.id === documentId);
    if (card && !card.markdown) {
      if (documentId === 'quiz' && !this.quizStreamSub) {
        this.startQuizStream();
      } else if (documentId === 'activities' && !this.activitiesStreamSub) {
        this.startActivitiesStream();
      } else if (documentId === 'keywords' && !this.keywordsStreamSub) {
        this.startKeywordsStream();
      }
    }
  }

  protected get planTitle(): string {
    const r = this.request();
    return r ? `${r.grade} ${r.subject} — ${r.topic}` : 'Study Plan';
  }

  protected get summaryFacts(): { icon: string; label: string }[] {
    const r = this.request();
    if (!r) return [];
    return [
      { icon: 'school', label: r.grade },
      { icon: 'biotech', label: r.subject },
      { icon: 'map', label: r.state },
    ];
  }

  private startPlanStream(): void {
    this.planStreamSub = this.api.streamStudyPlan(this.request()!).subscribe({
      next: (token) => this.updateCardMarkdown('study-plan', token),
      error: (err) => {
        console.error('Plan stream error', err);
        this.planStreamSub = null;
      },
      complete: () => {
        this.planStreamSub = null;
      },
    });
  }

  protected readonly isTestGenerated = computed(() => {
    const type = this.testType();
    const card = this.actionCards().find((c) => c.type === type);
    return !!(card && card.markdown);
  });

  private startQuizStream(): void {
    this.quizStreamSub = this.api.streamQuiz(this.request()!).subscribe({
      next: (token) => this.updateCardMarkdown('quiz', token),
      error: (err) => {
        console.error('Quiz stream error', err);
        this.quizStreamSub = null;
      },
      complete: () => {
        this.quizStreamSub = null;
        this.finalizeMarkdown('quiz');
      },
    });
  }

  private startActivitiesStream(): void {
    this.activitiesStreamSub = this.api.streamActivities(this.request()!).subscribe({
      next: (token) => this.updateCardMarkdown('activities', token),
      error: (err) => {
        console.error('Activities stream error', err);
        this.activitiesStreamSub = null;
      },
      complete: () => {
        this.activitiesStreamSub = null;
        this.finalizeMarkdown('activities');
      },
    });
  }

  private startKeywordsStream(): void {
    this.keywordsStreamSub = this.api.streamKeywords(this.request()!).subscribe({
      next: (token) => this.updateCardMarkdown('keywords', token),
      error: (err) => {
        console.error('Keywords stream error', err);
        this.keywordsStreamSub = null;
      },
      complete: () => {
        this.keywordsStreamSub = null;
        this.finalizeMarkdown('keywords');
      },
    });
  }

  private updateCardMarkdown(id: string, token: string): void {
    this.actionCards.update((cards) =>
      cards.map((c) => (c.id === id ? { ...c, markdown: c.markdown + token } : c))
    );
  }

  private finalizeMarkdown(id: string): void {
    this.actionCards.update((cards) =>
      cards.map((c) => {
        if (c.id === id) {
          return { ...c, generatedLevel: c.level };
        }
        return c;
      })
    );
  }

  protected isLevelLocked(level: string): boolean {
    const card = this.actionCards().find(c => c.type === this.testType());
    return !!(card && card.generatedLevel === level);
  }

  protected readonly isGeneratingPdf = signal(false);
  protected readonly pdfBlobUrl = signal<string | null>(null);

  protected async downloadPdf(): Promise<void> {
    if (this.isGeneratingPdf()) return;
    this.isGeneratingPdf.set(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.querySelector('.markdown-render') as HTMLElement;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12; // 12 mm on all sides
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/jpeg', 0.82);
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      const blob = pdf.output('blob');

      const filename = `${this.planTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(filename);

      // Upload to Supabase for a permanent cross-device URL; fall back to
      // a local blob URL so the QR always renders even if upload is unavailable.
      try {
        const { url } = await firstValueFrom(this.api.uploadPdf(blob));
        this.pdfBlobUrl.set(url);
      } catch {
        const prev = this.pdfBlobUrl();
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        this.pdfBlobUrl.set(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  protected async copyMarkdown(): Promise<void> {
    const markdown = this.displayMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      this.showCopiedState();
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  private showCopiedState(): void {
    this.copyLabel.set('Copied');
    window.setTimeout(() => {
      this.copyLabel.set('Copy');
    }, 1600);
  }
}
