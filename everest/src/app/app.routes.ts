import { Routes } from '@angular/router';
import { LandingComponent } from '../landing/landing.component';
import { DiscoverComponent } from '../discover/discover.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
  },
  {
    path: 'discover',
    component: DiscoverComponent,
  },
  {
    path: 'landing',
    redirectTo: '',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
