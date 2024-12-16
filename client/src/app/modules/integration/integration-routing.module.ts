import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GithubIntegrationComponent} from "./components/github-integration/github-integration.component";
import { DynamicAgGridTableComponent } from './components/dynamic-ag-grid-table/dynamic-ag-grid-table.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'task-03',
    pathMatch: 'full'
  },
  {
    path: 'github',
    component: GithubIntegrationComponent
  },
  {
    path: 'task-03',
    component: DynamicAgGridTableComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntegrationRoutingModule { }
