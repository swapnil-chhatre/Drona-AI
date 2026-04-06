import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DiscoverComponent } from '../discover/discover.component';
import { SidebarComponent } from '../common/sidebar/sidebar.component';
import { SidebarNavItem } from '../common/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DiscoverComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly sidebarItems: SidebarNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/', active: true },
    { label: 'My Study Plans', icon: 'menu_book' },
    { label: 'Uploaded Docs', icon: 'upload_file' },
    { label: 'Settings', icon: 'settings' },
  ];
}
