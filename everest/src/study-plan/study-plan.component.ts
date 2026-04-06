import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { marked } from 'marked';
import { SidebarComponent } from '../common/sidebar/sidebar.component';
import { ApiService } from '../services/api.service';
import { PlanStateService } from '../services/plan-state.service';

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './study-plan.component.html',
  styleUrl: './study-plan.component.css',
})
export class StudyPlanComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly planState = inject(PlanStateService);
  private streamSub: Subscription | null = null;

  protected readonly request = this.planState.request;

  protected readonly markdown = signal('');
  protected readonly isStreaming = signal(false);
  protected readonly isDone = signal(false);

  // Recomputes whenever markdown signal updates. marked.parse() is synchronous
  // and returns a string. Content comes from our own LLM so trusting it is safe.
  protected readonly renderedHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(marked.parse(this.markdown()) as string)
  );

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

  protected get planTitle(): string {
    const r = this.request();
    if (!r) return 'Study Plan';
    return `${r.grade} ${r.subject} — ${r.topic}`;
  }

  private startStream(): void {
    this.isStreaming.set(true);
    this.streamSub = this.api.streamStudyPlan(this.request()!).subscribe({
      next: (token) => this.markdown.update(md => md + token),
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
}
