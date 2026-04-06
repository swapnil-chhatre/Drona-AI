import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../common/sidebar/sidebar.component';
import { DiscoverRequest } from '../interfaces/discover-request';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [SidebarComponent, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly router = inject(Router);

  protected readonly gradeLevels = [{ label: 'Grade 8', selected: true }];

  protected readonly subjectAreas = [{ label: 'Science', selected: true }];

  protected readonly curriculumStandards = [
    'NSW - Australia',
    'Common Core - USA',
    'Ontario Curriculum - Canada',
    'National Curriculum - UK',
  ];

  protected readonly selectedStandard = signal(this.curriculumStandards[0]);

  protected readonly focusTopic = signal('');

  protected readonly suggestedPrompts = [
    'Climate Change Impact',
    'Plate Tectonics',
    'Cellular Mitosis',
  ];

  protected setFocusTopic(prompt: string): void {
    this.focusTopic.set(prompt);
  }

  protected sendPrompt(): void {
    const request: DiscoverRequest = {
      grade: 'Grade 8',
      subject: 'Science',
      state: this.selectedStandard(),
      topic: this.focusTopic(),
    };

    void this.router.navigate(['/discover'], {
      state: { request },
    });
  }
}
