import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GithubIntegrationService } from '../../../../common/services/github-integration.service';
import { ColDef, ColGroupDef, ColumnApi, GridApi, GridOptions, GridReadyEvent, RowDragEndEvent, SideBarDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { IGithubIntegration } from '../../../../common/models/IGithubIntegration';
import 'ag-grid-enterprise';


interface GridData {
  id: number;
  rows: any[];
  integrations: Array<IGithubIntegration>;
  selectedIntegration: IGithubIntegration | null;
  selectedProject: any;
  projects: any[];
  columnDefs: Array<ColDef | ColGroupDef>;
  rowData: any[];
  searchText: ''
}

@Component({
  selector: 'app-dynamic-ag-grid-table',
  templateUrl: './dynamic-ag-grid-table.component.html',
  styleUrls: ['./dynamic-ag-grid-table.component.scss']
})
export class DynamicAgGridTableComponent implements OnInit {
  
  @ViewChild('selectPanel', { static: false }) selectIntegrationPanel!: ElementRef;
  grids: GridData[] = [];

  gridApis: {[key: number]: {gridApi: GridApi, columnApi: ColumnApi}} = {};
  isLoading: {[key: string]: boolean} = {};
  pagination = {
    limit: 100,
    page: 0
  }

  repositoryPagination = {
    limit: 100,
    page: 0
  }

  integrations: Array<IGithubIntegration> = [];

  isColumnAlreadyGenerated: {[key: string]: boolean} = {};

  constructor(
    private readonly githubIntegrationService: GithubIntegrationService,
    private readonly toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAllIntegrations();
  }

  loadAllIntegrations(): void {
    this.githubIntegrationService.integrations(this.pagination.limit, this.pagination.page).subscribe(response => {
      if (response.data.length >= 100) {
        this.pagination.page++;
      }
      this.integrations.push(...response.data);
    }, error => {
      this.toastrService.error(error?.error?.error ?? 'Failed to load integrations');
    });
  }

  // Grid ready event handler
  onGridReady(params: GridReadyEvent, grid: GridData, index: number) {
    this.gridApis[index] = {
      columnApi: params.columnApi,
      gridApi: params.api
    }
  }

  // Row drag end event handler
  onRowDragMoved(event: RowDragEndEvent, grid: GridData) {
    console.log('Row drag ended for grid:', grid.id);
  }

  onIntegrationSelect(grid: GridData, index: number) {
    if (grid.selectedIntegration?._id) {
      this.loadAllProjects(grid.selectedIntegration._id, index);
    }
  }

  get sideBar(): SideBarDef {
    return  {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressPivotMode: true,
            suppressRowGroups: true,
            suppressValues: true,
          },
        },
      ],
    }
  };

  get gridOptions(): GridOptions {
    return {
      sideBar: this.sideBar
    }
  }

  addNewGrid() {
    const newGrid: GridData = {
      id: this.grids.length + 1,
      rows: [],
      selectedIntegration: null,
      selectedProject: null,
      projects: [],
      integrations: this.integrations,
      columnDefs: [],
      rowData: [],
      searchText: ''
    };
    this.grids.push(newGrid);
  }

  // Delete a specific grid by index
  deleteGrid(index: number) {
    this.grids.splice(index, 1);
  }

  onProjectSelect(grid: GridData, index: number): void {
    if (!this.isColumnAlreadyGenerated[index]) {
      grid.columnDefs = this.generateColDefs(grid.selectedProject);
    }
    grid.rowData = [this.flattenRowData(grid.selectedProject)];
  }

  loadAllProjects(integrationId: string, index: number): void {
    this.githubIntegrationService.repositoriesByIntegrationId(integrationId).subscribe(response => {
      this.grids[index].projects = response.data;
    }, error => {
      this.toastrService.error(error?.error?.error ?? 'Failed to load integrations');
    });
  }

  flattenRowData(data: any, parentKey: string = '', result: any = {}): any {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const fullKey = parentKey ? `${parentKey}_${key}` : key;
  
        if (typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null) {
          // Recursively flatten nested objects
          this.flattenRowData(data[key], fullKey, result);
        } else {
          // Assign primitive values directly
          result[fullKey] = data[key];
        }
      }
    }
    return result;
  }

  generateColDefs(data: any): (ColDef | ColGroupDef)[] {
    const colDefs: any[] = [];
  
    const processKey = (key: string, value: any, parentKey: string = '') => {
      const fullKey = parentKey ? `${parentKey}_${key}` : key;
  
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // Create a group header for nested objects
        const groupColDef: ColGroupDef = {
          headerName: this.capitalizeFirstLetter(key),
          children: [],
        };
  
        Object.keys(value).forEach((nestedKey) => {
          // Push children into the groupColDef's children array
          const childColDefs = processKey(nestedKey, value[nestedKey], fullKey);
          groupColDef.children!.push(...(Array.isArray(childColDefs) ? childColDefs : [childColDefs]));
        });
  
        return groupColDef; // Return the group column definition
      } else {
        // Create a regular column for primitive values
        return {
          field: fullKey,
          headerName: this.capitalizeFirstLetter(key),
          
        } as ColDef;
      }
    };
  
    Object.keys(data).forEach((key) => {
      const colDef = processKey(key, data[key]);
      if (Array.isArray(colDef)) {
        colDefs.push(...colDef);
      } else {
        colDefs.push(colDef);
      }
    });
  
    return colDefs;
  }
  

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onSearch(grid: GridData, index: number): void {
    this.gridApis[index].gridApi.setQuickFilter(grid.searchText);
  }

}
