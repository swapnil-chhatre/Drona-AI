import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'everest';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.getHealth().subscribe(() => {
      console.log('got health');
    });
  }
}
