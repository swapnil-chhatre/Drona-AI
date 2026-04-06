import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiscoverRequest } from '../interfaces/discover-request';
import { DiscoverStateService } from '../services/discover-state.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly discoverState = inject(DiscoverStateService);
  private readonly api = inject(ApiService);

  protected readonly grades = signal<string[]>([]);
  protected readonly subjects = signal<string[]>([]);
  protected readonly suggestedPrompts = signal<string[]>([]);

  protected readonly selectedGrade = signal('Year 8');
  protected readonly selectedSubject = signal('Science');

  protected readonly curriculumStandards = [
    'NSW - Australia',
    'Common Core - USA',
    'Ontario Curriculum - Canada',
    'National Curriculum - UK',
  ];

  protected readonly selectedStandard = signal(this.curriculumStandards[0]);
  protected readonly focusTopic = signal('');

  ngOnInit(): void {
    this.loadSuggestions();
  }

  protected selectGrade(grade: string): void {
    this.selectedGrade.set(grade);
    this.loadSuggestions();
  }

  protected selectSubject(subject: string): void {
    this.selectedSubject.set(subject);
    this.loadSuggestions();
  }

  protected setFocusTopic(prompt: string): void {
    this.focusTopic.set(prompt);
  }

  protected sendPrompt(): void {
    const request: DiscoverRequest = {
      grade: this.selectedGrade(),
      subject: this.selectedSubject(),
      state: this.selectedStandard(),
      topic: this.focusTopic(),
    };

    this.discoverState.set(request);
    void this.router.navigate(['/discover']);
  }

  private loadSuggestions(): void {
    this.api.getSuggestions(this.selectedGrade(), this.selectedSubject()).subscribe({
      next: (response) => {
        this.grades.set(response.grades);
        this.subjects.set(response.subjects);
        this.suggestedPrompts.set(response.suggestions);
      },
      error: (err) => console.error('Failed to load suggestions', err),
    });
  }
}
