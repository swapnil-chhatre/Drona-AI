import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from '../common/sidebar/sidebar.component';
import { DiscoverRequest } from '../interfaces/discover-request';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly router = inject(Router);

  protected readonly gradeLevels = [
    { label: 'K-5', selected: false },
    { label: '6-8', selected: false },
    { label: '9-12', selected: false },
  ];

  protected readonly subjectAreas = [
    { label: 'Mathematics', selected: false },
    { label: 'Science', selected: false },
    { label: 'History', selected: false },
    { label: 'Economics', selected: false },
    { label: 'Literature', selected: false },
  ];

  protected readonly curriculumStandards = [
    'NSW - Australia',
    'Common Core - USA',
    'Ontario Curriculum - Canada',
    'National Curriculum - UK',
  ];

  protected readonly suggestedPrompts = [
    'Climate Change Impact',
    'Python Fundamentals',
    'Renaissance Art History',
  ];

  protected sendPrompt(): void {
    const request: DiscoverRequest = {
      grade: 'Year 10',
      subject: 'History',
      state: 'NSW',
      topic: 'Causes of World War I',
      uploaded_doc_ids: [],
    };

    void this.router.navigate(['/discover'], {
      state: { request },
    });
  }
}
