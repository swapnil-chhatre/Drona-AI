import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DiscoverRequest } from '../interfaces/discover-request';
import { Resource } from '../interfaces/resource';
import { CurriculumOutcome } from '../interfaces/curriculum-outcome';
import { GenerateRequest } from '../interfaces/generate-request';
import { ApiService } from '../services/api.service';
import { DiscoverStateService } from '../services/discover-state.service';
import { PlanStateService } from '../services/plan-state.service';

type ResourceBadgeTone = 'primary' | 'source' | 'muted';

interface DiscoverResource extends Resource {
  selected: boolean;
  metaIcon: string;
  metaLabel: string;
  badgeText: string;
  badgeTone: ResourceBadgeTone;
  tags: string[];
  dimmed?: boolean;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
})
export class DiscoverComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly discoverState = inject(DiscoverStateService);
  private readonly planState = inject(PlanStateService);

  protected readonly request: DiscoverRequest = this.getRequest();
  protected readonly resources = signal<DiscoverResource[]>([]);
  protected readonly curriculumOutcomes = signal<CurriculumOutcome[]>([]);
  protected readonly isLoading = signal(false);

  protected readonly aiRecommendation = signal<string>('');

  protected get selectedResources(): DiscoverResource[] {
    return this.resources().filter((r) => r.selected);
  }

  protected get selectedCountLabel(): string {
    const count = this.selectedResources.length;
    return count === 0
      ? 'No items selected'
      : `${count} item${count === 1 ? '' : 's'} ready for processing`;
  }

  ngOnInit(): void {
    if (this.request.topic) {
      this.fetchResources();
    }
  }

  protected get hasTopic(): boolean {
    return !!this.request.topic;
  }

  protected get topicTitle(): string {
    return this.request.topic || 'New Discovery';
  }

  protected goToDashboard(): void {
    void this.router.navigate(['/']);
  }

  protected get requestSummary(): string {
    return `Showing discovery results for ${this.request.grade} ${this.request.subject} aligned to ${this.request.state}.`;
  }

  protected onGeneratePlan(): void {
    this.planState.set({
      grade: this.request.grade,
      subject: this.request.subject,
      state: this.request.state,
      topic: this.request.topic,
      selected_resources: this.selectedResources,
      curriculum_outcomes: this.curriculumOutcomes(),
    });
    void this.router.navigate(['/final-result']);
  }

  protected toggleSelection(resource: DiscoverResource): void {
    this.resources.update((list) =>
      list.map((r) => (r === resource ? { ...r, selected: !r.selected } : r)),
    );
  }

  private fetchResources(): void {
    this.isLoading.set(true);
    this.api.discoverResources(this.request).subscribe({
      next: (response) => {
        const mapped = response.resources.map((r) =>
          this.mapToDiscoverResource(r),
        );
        this.resources.set(mapped);
        this.curriculumOutcomes.set(response.curriculum_outcomes);
        this.aiRecommendation.set(response.ai_recommendation ?? '');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch resources', err);
        this.isLoading.set(false);
      },
    });
  }

  private mapToDiscoverResource(resource: Resource): DiscoverResource {
    return {
      ...resource,
      selected: false,
      metaIcon:
        resource.source_type === 'teacher_upload' ? 'description' : 'public',
      metaLabel:
        resource.domain ||
        (resource.source_type === 'teacher_upload'
          ? 'Uploaded Document'
          : 'Web Resource'),
      badgeText: {
        exemplary: '100% Alignment',
        high: '85% Alignment',
        medium: '70% Alignment',
        low: '50% Alignment',
        minimal: '30% Alignment',
      }[resource.curriculum_alignment],
      badgeTone:
        resource.curriculum_alignment === 'exemplary' ||
        resource.curriculum_alignment === 'high'
          ? 'primary'
          : 'muted',
      tags: resource.source_type === 'web' ? ['Core Theory'] : [],
    };
  }

  private getRequest(): DiscoverRequest {
    return (
      this.discoverState.request() ?? {
        grade: 'Year 8',
        subject: 'Science',
        state: 'NSW - Australia',
        topic: '',
      }
    );
  }
}
