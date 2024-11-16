import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'integrations',
    pathMatch: 'full'
  },
  {
    path: 'integrations',
    loadChildren: () => import('./modules/integration/integration.module').then(m => m.IntegrationModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
