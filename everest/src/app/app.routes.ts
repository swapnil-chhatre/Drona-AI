import { Routes } from '@angular/router';
import { LandingComponent } from '../landing/landing.component';
import { DiscoverComponent } from '../discover/discover.component';
import { FinalResultComponent } from '../final-result/final-result.component';

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
    path: 'final-result',
    component: FinalResultComponent,
  },
  {
    path: 'final',
    redirectTo: 'final-result',
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
