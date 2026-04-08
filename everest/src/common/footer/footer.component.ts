import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  developers = [
    {
      name: 'Abraham Wilson',
      url: 'https://www.linkedin.com/in/abraham-wilson-aba231192/',
    },
    {
      name: 'Swapnil Chhatre',
      url: 'https://www.linkedin.com/in/swapnilchhatre/',
    },
    {
      name: 'Ruben Easo Thomas',
      url: 'https://www.linkedin.com/in/ruben-easo-thomas/',
    },
  ];
}
