import { Component } from '@angular/core';
import { SidebarComponent, SidebarNavItem } from '../common/sidebar/sidebar.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  protected readonly sidebarItems: SidebarNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/', active: true },
    { label: 'My Study Plans', icon: 'menu_book' },
    { label: 'Uploaded Docs', icon: 'upload_file' },
    { label: 'Settings', icon: 'settings' },
  ];

  protected readonly gradeLevels = [
    { label: 'K-5', selected: true },
    { label: '6-8', selected: false },
    { label: '9-12', selected: false },
  ];

  protected readonly subjectAreas = [
    { label: 'Mathematics', selected: false },
    { label: 'Science', selected: true },
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
}
