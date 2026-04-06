import { Component } from '@angular/core';
import { SidebarComponent } from '../common/sidebar/sidebar.component';
import { Resource } from '../interfaces/resource';

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

interface SelectedResourceSummary {
  title: string;
  source: string;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
})
export class DiscoverComponent {
  protected readonly resources: DiscoverResource[] = [
    {
      title: 'The Dual Nature of Light: Wave-Particle Duality',
      url: 'https://edu.mit.edu/physics/quantum-foundations',
      summary:
        "Comprehensive lecture notes covering the double-slit experiment, photon momentum, and De Broglie's wavelength calculations. Perfectly matches Section 1.4 of your syllabus.",
      source_type: 'web',
      curriculum_alignment: 'high',
      bias_risk: 'low',
      reading_level: 'Advanced secondary',
      domain: 'mit.edu',
      follow_up_questions: [],
      selected: true,
      metaIcon: 'public',
      metaLabel: 'https://edu.mit.edu/physics/quantum-foundations',
      badgeText: '98% Alignment',
      badgeTone: 'primary',
      tags: ['Core Theory', 'Lecture Notes'],
    },
    {
      title: 'Syllabus_Physics_Draft_2024.pdf',
      url: null,
      summary:
        'Your uploaded primary curriculum document. Drona-AI is using this as the architectural backbone for the study plan structure.',
      source_type: 'teacher_upload',
      curriculum_alignment: 'high',
      bias_risk: 'low',
      reading_level: 'Teacher source',
      domain: null,
      follow_up_questions: [],
      document_id: 'physics-draft-2024',
      selected: true,
      metaIcon: 'description',
      metaLabel: 'Uploaded Document • 2.4 MB',
      badgeText: '100% Source',
      badgeTone: 'source',
      tags: [],
    },
    {
      title: 'Heisenberg Uncertainty Principle Simplified',
      url: 'https://www.youtube.com/watch?v=example',
      summary:
        'Visual breakdown of the uncertainty principle. Recommended as supplementary material for visual learners.',
      source_type: 'web',
      curriculum_alignment: 'medium',
      bias_risk: 'medium',
      reading_level: 'General secondary',
      domain: 'youtube.com',
      follow_up_questions: [],
      selected: false,
      metaIcon: 'movie',
      metaLabel: 'YouTube • ScienceSimplified Channel',
      badgeText: '82% Alignment',
      badgeTone: 'muted',
      tags: ['Supplementary', 'Video'],
      dimmed: true,
    },
  ];

  protected readonly selectedResources: SelectedResourceSummary[] = [
    { title: 'Dual Nature of Light', source: 'mit.edu' },
    { title: 'Syllabus_Physics_Draft_2024.pdf', source: 'Internal Document' },
    { title: 'Photoelectric Effect Basics', source: 'khanacademy.org' },
  ];

  protected readonly planSummary = {
    selectedCountLabel: '4 items ready for processing',
    planDepth: 'Comprehensive',
    readingTime: '~4.5 Hours',
  };

  protected readonly recommendation =
    'I recommend including the "Dual Nature of Light" MIT resource. It provides the mathematical rigor missing in the other detected web results and aligns perfectly with your "Module 1" learning objectives.';
}
