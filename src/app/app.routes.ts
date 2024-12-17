import { Routes } from '@angular/router';
import { ChecklistComponent } from './checklist/checklist.component';

export const routes: Routes = [
  {
    path: 'checklist',
    component: ChecklistComponent,
  },
  {
    path: '**',
    redirectTo: 'checklist',
    pathMatch: 'full',
  },
];
