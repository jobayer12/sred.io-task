import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { GithubIntegrationComponent } from './components/github-integration/github-integration.component';
import {IntegrationRoutingModule} from "./integration-routing.module";
import {MatCardModule} from "@angular/material/card";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AgGridModule } from 'ag-grid-angular';
import { GithubAuthComponent } from './components/github-auth/github-auth.component';
import { DynamicAgGridTableComponent } from './components/dynamic-ag-grid-table/dynamic-ag-grid-table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSelectModule} from '@angular/material/select';
import {MatPaginatorModule} from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@NgModule({
  declarations: [
    GithubIntegrationComponent,
    GithubAuthComponent,
    DynamicAgGridTableComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    AgGridModule,
    IntegrationRoutingModule,
    MatProgressBarModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSelectModule,
    MatPaginatorModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    DatePipe
  ]
})
export class IntegrationModule { }
