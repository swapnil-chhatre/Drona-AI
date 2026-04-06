import { Component, input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { SidebarComponent } from '../common/sidebar/sidebar.component';
import {
  FinalResultAction,
  FinalResultChunk,
  FinalResultExportOption,
  FinalResultResponse,
} from '../interfaces/final-result';

@Component({
  selector: 'app-final-result',
  standalone: true,
  imports: [SidebarComponent, MarkdownComponent],
  templateUrl: './final-result.component.html',
  styleUrl: './final-result.component.css',
})
export class FinalResultComponent {
  readonly responsePayload = input<FinalResultResponse | null>(null);
  protected readonly fallbackResponse: FinalResultResponse = {
    eyebrow: 'AI-GENERATED ARCHITECTURAL BLUEPRINT',
    title: 'Advanced Neural Architectures & Cognitive Flow',
    createdAt: 'Oct 24, 2023',
    duration: '12 Week Course',
    level: 'Graduate Level',
    tabs: [
      { label: 'Primary Plan', active: true },
      { label: 'Differentiation A' },
      { label: 'Extension Activities' },
      { label: 'Assessment Rubric' },
    ],
    chunks: [
      {
        id: 'learning-objectives',
        title: 'Learning Objectives',
        icon: 'target',
        accent: 'primary',
        markdown: `
### Objective 01
Synthesize complex neural network topologies with attention-based mechanisms for multi-modal processing.

### Objective 02
Evaluate the structural integrity of latent spaces in generative adversarial frameworks and diffusion models.

### Objective 03
Implement ethical bias mitigation strategies across decentralized learning nodes.
        `.trim(),
      },
      {
        id: 'activities',
        title: 'Core Learning Activities',
        icon: 'rocket_launch',
        accent: 'tertiary',
        markdown: `
#### Deep Dive: Analysis
Perform a comparative analysis of Transformer vs. State Space models using the provided Jupyter environment.

#### Architectural Build
Construct a miniature latent flow model with 3 distinct branching pathways for cross-attention testing.
        `.trim(),
      },
      {
        id: 'resources',
        title: 'Curated Resources & Citations',
        icon: 'library_books',
        accent: 'primary',
        markdown: `
- **Vaswani et al. (2017)**  
  Attention Is All You Need — NIPS Foundation

- **Diffusion Theory Masterclass**  
  Stanford Engineering Series (Video)
        `.trim(),
      },
      {
        id: 'assessment',
        title: 'Mastery Assessment',
        icon: 'fact_check',
        accent: 'primary',
        markdown: `
#### Capstone Project: The Resilient Mind
Design a self-healing neural network schema that maintains functional accuracy after **30% synthetic neuron loss**.

- Submit as a documented PDF with architecture diagrams
- Due in **14 days**
- Weighted at **40%**
        `.trim(),
      },
    ],
    actions: [
      { label: 'Study Plan', icon: 'menu_book', tone: 'primary' },
      { label: 'Quiz', icon: 'quiz', tone: 'tertiary' },
      { label: 'Vocab List', icon: 'translate', tone: 'secondary' },
      { label: 'Activities', icon: 'groups', tone: 'primary' },
    ],
    exports: [
      { label: 'Download as PDF', icon: 'picture_as_pdf', actionIcon: 'download' },
    ],
  };

  protected get viewModel(): FinalResultResponse {
    return this.responsePayload() ?? this.fallbackResponse;
  }

  protected get summaryFacts(): { icon: string; label: string }[] {
    return [
      { icon: 'calendar_today', label: this.viewModel.createdAt },
      { icon: 'timer', label: this.viewModel.duration },
      { icon: 'school', label: this.viewModel.level },
    ];
  }

  protected get actionCards(): FinalResultAction[] {
    return this.viewModel.actions;
  }

  protected get exportOptions(): FinalResultExportOption[] {
    return this.viewModel.exports;
  }

  protected get markdownChunks(): FinalResultChunk[] {
    return this.viewModel.chunks;
  }

  protected trackChunk(_index: number, chunk: FinalResultChunk): string {
    return chunk.id;
  }
}
