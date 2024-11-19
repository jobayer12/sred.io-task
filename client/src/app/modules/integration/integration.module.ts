import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { GithubIntegrationComponent } from './components/github-integration/github-integration.component';
import {IntegrationRoutingModule} from "./integration-routing.module";
import {MatCardModule} from "@angular/material/card";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  declarations: [
    GithubIntegrationComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    AgGridModule,
    IntegrationRoutingModule,
    MatProgressBarModule
  ],
  providers: [
    DatePipe
  ]
})
export class IntegrationModule { }
