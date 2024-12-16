import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GithubAuthComponent } from './modules/integration/components/github-auth/github-auth.component';
import { AuthGuard } from './common/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'integrations',
    pathMatch: 'full'
  },
  {
    path: 'oauth',
    component: GithubAuthComponent
  },
  {
    path: 'integrations',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/integration/integration.module').then(m => m.IntegrationModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
