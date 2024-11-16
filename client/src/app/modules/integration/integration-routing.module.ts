import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GithubIntegrationComponent} from "./components/github-integration/github-integration.component";

const routes: Routes = [
  {
    path: '',
    redirectTo: 'github',
    pathMatch: 'full'
  },
  {
    path: 'github',
    component: GithubIntegrationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntegrationRoutingModule { }
