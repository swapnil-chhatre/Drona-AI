import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { ApiService } from '../services/api.service';
import { Router, RouterLink } from '@angular/router';
import { PlanStateService } from '../services/plan-state.service';
import { Subscription } from 'rxjs';
import { FinalResultDocument } from '../interfaces/final-result';

@Component({
  selector: 'app-final-result',
  standalone: true,
  imports: [MarkdownComponent, RouterLink],
  templateUrl: './final-result.component.html',
  styleUrl: './final-result.component.css',
})
export class FinalResultComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly planState = inject(PlanStateService);
  private streamSub: Subscription | null = null;

  protected readonly request = this.planState.request;
  protected readonly markdown = signal('');
  protected readonly isStreaming = signal(false);
  protected readonly isDone = signal(false);
  protected readonly copyLabel = signal('Copy');

  protected readonly activeDocumentId = signal('study-plan');

  protected readonly actionCards: FinalResultDocument[] = [
    {
      id: 'study-plan',
      label: 'Study Plan',
      icon: 'menu_book',
      tone: 'primary',
      markdown: '',
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: 'quiz',
      tone: 'tertiary',
      markdown:
        '# Quiz\n\n*Coming soon: AI-generated assessment for this topic.*',
    },
    {
      id: 'vocab',
      label: 'Vocab List',
      icon: 'translate',
      tone: 'secondary',
      markdown: '# Vocabulary\n\n*Coming soon: Key terms and definitions.*',
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: 'groups',
      tone: 'primary',
      markdown: '# Activities\n\n*Coming soon: Collaborative learning tasks.*',
    },
  ];

  protected readonly activeDocument = computed(() => {
    return (
      this.actionCards.find((doc) => doc.id === this.activeDocumentId()) ??
      this.actionCards[0]
    );
  });

  protected readonly displayMarkdown = computed(() => {
    // If we're looking at the study plan, show the live stream.
    if (this.activeDocumentId() === 'study-plan') {
      return (
        this.markdown() ||
        '# Study Plan\n\n*Initializing your customized blueprint...*'
      );
    }
    // Otherwise show the static markdown for that document type.
    return this.activeDocument().markdown;
  });

  ngOnInit(): void {
    if (!this.request()) {
      void this.router.navigate(['/']);
      return;
    }
    this.startStream();
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }

  protected selectDocument(documentId: string): void {
    this.activeDocumentId.set(documentId);
    this.copyLabel.set('Copy');
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

  private startStream(): void {
    this.isStreaming.set(true);
    this.streamSub = this.api.streamStudyPlan(this.request()!).subscribe({
      next: (token) => this.markdown.update((md) => md + token),
      error: (err) => {
        console.error('Stream error', err);
        this.isStreaming.set(false);
      },
      complete: () => {
        this.isStreaming.set(false);
        this.isDone.set(true);
      },
    });
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
