import { Component, input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { SidebarComponent, SidebarNavItem } from '../common/sidebar/sidebar.component';
import {
  FinalResultDocument,
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

  protected readonly sidebarItems: SidebarNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/' },
    { label: 'My Study Plans', icon: 'menu_book', route: '/final-result', active: true },
    { label: 'Uploaded Docs', icon: 'upload_file' },
    { label: 'Settings', icon: 'settings' },
  ];

  protected activeDocumentId = 'study-plan';
  protected copyLabel = 'Copy';

  protected readonly fallbackResponse: FinalResultResponse = {
    eyebrow: 'AI-GENERATED ARCHITECTURAL BLUEPRINT',
    title: 'Advanced Neural Architectures & Cognitive Flow',
    createdAt: 'Oct 24, 2023',
    duration: '12 Week Course',
    level: 'Graduate Level',
    documents: [
      {
        id: 'study-plan',
        label: 'Study Plan',
        icon: 'menu_book',
        tone: 'primary',
        markdown: `
# Advanced Neural Architectures & Cognitive Flow

## Learning Objectives
1. Synthesize complex neural network topologies with attention-based mechanisms for multi-modal processing.
2. Evaluate the structural integrity of latent spaces in generative adversarial frameworks and diffusion models.
3. Implement ethical bias mitigation strategies across decentralized learning nodes.

## Core Learning Activities
### Deep Dive: Analysis
Perform a comparative analysis of Transformer vs. State Space models using the provided Jupyter environment.

### Architectural Build
Construct a miniature latent flow model with 3 distinct branching pathways for cross-attention testing.

## Curated Resources & Citations
- **Vaswani et al. (2017)**  
  Attention Is All You Need — NIPS Foundation
- **Diffusion Theory Masterclass**  
  Stanford Engineering Series (Video)

## Mastery Assessment
### Capstone Project: The Resilient Mind
Design a self-healing neural network schema that maintains functional accuracy after **30% synthetic neuron loss**.

- Submit as a documented PDF with architecture diagrams
- Due in **14 days**
- Weighted at **40%**
        `.trim(),
      },
      {
        id: 'quiz',
        label: 'Quiz',
        icon: 'quiz',
        tone: 'tertiary',
        markdown: `
# Advanced Neural Architectures Quiz

## Section A: Concept Check
1. Explain why attention mechanisms outperform recurrence in long-context sequence modeling.
2. Compare diffusion models and GANs in terms of latent stability and training dynamics.
3. Define one concrete bias mitigation strategy for distributed training systems.

## Section B: Applied Reasoning
### Prompt 1
Given a multi-modal architecture with text and vision branches, describe how cross-attention should be evaluated.

### Prompt 2
Outline a testing strategy for model robustness after synthetic neuron loss.
        `.trim(),
      },
      {
        id: 'vocab-list',
        label: 'Vocab List',
        icon: 'translate',
        tone: 'secondary',
        markdown: `
# Neural Architectures Vocabulary List

## Essential Terms
- **Cross-attention**: A mechanism where one sequence attends to another sequence's representations.
- **Latent space**: A compressed feature representation used to encode meaningful structure.
- **Diffusion model**: A generative model that learns to reverse a gradual noise process.
- **Bias mitigation**: Techniques used to reduce unfair or skewed model behavior.

## Discussion Prompts
- Which vocabulary term is most important when explaining multi-modal reasoning to a new learner?
- Which term best connects theory with classroom implementation?
        `.trim(),
      },
      {
        id: 'activities',
        label: 'Activities',
        icon: 'groups',
        tone: 'primary',
        markdown: `
# Collaborative Activities

## Workshop 1: Architecture Debate
Learners compare Transformer, State Space, and diffusion-style pipelines in small teams and defend a design choice.

## Workshop 2: Bias Audit Sprint
Teams inspect a training scenario, identify possible failure points, and propose mitigation interventions.

## Workshop 3: Resilience Lab
Students prototype a neural system that maintains acceptable performance after simulated component degradation.
        `.trim(),
      },
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

  protected get actionCards(): FinalResultDocument[] {
    return this.viewModel.documents;
  }

  protected get exportOptions(): FinalResultExportOption[] {
    return this.viewModel.exports;
  }

  protected get activeDocument(): FinalResultDocument {
    return (
      this.viewModel.documents.find((document) => document.id === this.activeDocumentId) ??
      this.viewModel.documents[0]
    );
  }

  protected selectDocument(documentId: string): void {
    this.activeDocumentId = documentId;
    this.copyLabel = 'Copy';
  }

  protected async copyMarkdown(): Promise<void> {
    const markdown = this.activeDocument.markdown;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        this.copyWithTextarea(markdown);
      }

      this.showCopiedState();
    } catch {
      this.copyWithTextarea(markdown);
      this.showCopiedState();
    }
  }

  private copyWithTextarea(markdown: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = markdown;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private showCopiedState(): void {
    this.copyLabel = 'Copied';
    window.setTimeout(() => {
      this.copyLabel = 'Copy';
    }, 1600);
  }
}
