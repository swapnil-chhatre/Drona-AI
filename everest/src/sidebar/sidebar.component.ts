import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly items = input<SidebarNavItem[]>([]);
  readonly brandTitle = input('Drona-AI');
  readonly brandSubtitle = input('Intellectual Architect');
  readonly brandIcon = input('architecture');
  readonly actionLabel = input('Generate New Plan');
  readonly actionIcon = input('add');
  readonly actionTriggered = output<void>();
}
