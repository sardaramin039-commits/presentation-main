import { Component } from '@angular/core';
import { MamLibraryDashboardComponent } from './components/mam-library-dashboard/mam-library-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MamLibraryDashboardComponent],
  template: '<app-mam-library-dashboard></app-mam-library-dashboard>'
})
export class AppComponent {}
