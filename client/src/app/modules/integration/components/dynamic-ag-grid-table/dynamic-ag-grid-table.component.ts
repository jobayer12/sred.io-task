import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GithubIntegrationService } from '../../../../common/services/github-integration.service';
import {
  ColDef,
  ColGroupDef,
  ColumnApi,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SideBarDef,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import 'ag-grid-enterprise';
import { AuthService } from '../../../../common/services/auth.service';
import { IJWTTokenDetails } from '../../../../common/models/IToken';
import { Observable } from 'rxjs';
import { MultiFilterModule, SetFilterModule,  } from 'ag-grid-enterprise';

// ModuleRegistry.registerModules([
//   MultiFilterModule,
//   SetFilterModule,
// ]);

type CollectionType = 'projects' | 'commits' | 'pull-requests' | 'issues';

type Pagination = {
  limit: number;
  page: number;
}

type GridData = {
  id: number;
  integrationId: string | undefined;
  columnDefs: Array<ColDef | ColGroupDef>;
  searchText: '',
  gridOptions: GridOptions,
  collection: CollectionType | null,
  pagination: Pagination;
}

@Component({
  selector: 'app-dynamic-ag-grid-table',
  templateUrl: './dynamic-ag-grid-table.component.html',
  styleUrls: ['./dynamic-ag-grid-table.component.scss']
})
export class DynamicAgGridTableComponent implements OnInit {

  @ViewChild('selectPanel', { static: false }) selectIntegrationPanel!: ElementRef;
  grids: GridData[] = [];

  entityCollections: Array<{ key: CollectionType, label: string }> = [
    {
      key: 'projects',
      label: 'Projects'
    },
    {
      key: 'commits',
      label: 'Commits'
    },
    {
      key: 'pull-requests',
      label: 'Pull Requests'
    },
    {
      key: 'issues',
      label: 'Issues'
    }
  ];

  gridApis: { [key: number]: { gridApi: GridApi, columnApi: ColumnApi } } = {};

  // loading in specific grid based on gridId
  isLoading: { [key: number]: boolean } = {};

  // default pagination
  defaultPagination: Pagination = {
    limit: 100,
    page: 1
  }

  // token details
  jwtTokenDetails!: IJWTTokenDetails | null;

  constructor(
    private readonly githubIntegrationService: GithubIntegrationService,
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService
  ) {
    if (this.authService.isAuthenticated()) {
      this.jwtTokenDetails = this.authService.decodeToken();
    }
  }

  ngOnInit(): void { }

  // Grid ready event handler
  onGridReady(params: GridReadyEvent, grid: GridData) {
    this.gridApis[grid.id] = {
      columnApi: params.columnApi,
      gridApi: params.api
    }
  }

  get sideBar(): SideBarDef {
    return {
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

  get defaultColDef(): (ColDef | ColGroupDef) {
    return {
      filter: false,
    }
  }

  get gridOptions(): GridOptions {
    return {
      sideBar: this.sideBar,
      pagination: true,
      defaultColDef: this.defaultColDef,
      paginationPageSize: 100,
      rowModelType: 'serverSide',
      paginationPageSizeSelector: [100],
    }
  }

  addNewGrid() {
    const newGrid: GridData = {
      id: this.grids.length,
      columnDefs: [],
      gridOptions: this.gridOptions,
      integrationId: this.jwtTokenDetails?.id,
      searchText: '',
      collection: null,
      pagination: this.defaultPagination
    };
    this.grids.push(newGrid);
  }

  // Delete a specific grid by index
  deleteGrid(index: number) {
    this.grids.splice(index, 1);
  }

  onCollectionChange(grid: GridData, index: number): void {
    if (!this.validateCollection(grid)) return;
    const apiCall = this.getApiCall(grid);
    if (!apiCall) {
      return;
    }
  
    // Call fetchData with the API call function and grid
    this.fetchData(apiCall, grid);
  }

  private validateCollection(grid: GridData): boolean {
    if (!grid.collection) {
      this.toastrService.error('Collection is not selected.');
      return false;
    }
    return true;
  }

  incrementPage(grid: GridData): void {
    grid.pagination.page += 1; // Increment page by 1
  }

  private fetchData(apiCall: (pagination: Pagination) => Observable<any>, grid: GridData): void {
    const dataSource: IServerSideDatasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        // Call the API with pagination parameters
        apiCall(grid.pagination).subscribe(
          (response) => {
            const { data, pagination } = response; // API response structure
            if (data.length > 0) {
              grid.columnDefs = this.generateColDefs(data[0]);
            }
            setTimeout(() => {
              params.success({
                rowData: data.map((d: any) => this.flattenRowData(d)),
                rowCount: pagination.totalCount || 100,
              });
            }, 200);
          },
          (error) => {
            console.error('Error fetching data:', error);
            params.fail(); // Notify AG-Grid of the failure
          }
        );
      },
    };
  
    this.gridApis[grid.id].gridApi.setGridOption('serverSideDatasource', dataSource);
  }

  private getApiCall(grid: GridData): (pagination: Pagination) => Observable<any> {
    switch (grid.collection) {
      case 'projects':
        return pagination => this.githubIntegrationService.repositories(pagination.limit, pagination.page);
      case 'commits':
        return pagination => this.githubIntegrationService.commits(pagination.limit, pagination.page);
      case 'pull-requests':
        return pagination => this.githubIntegrationService.pullRequests(pagination.limit, pagination.page);
      case 'issues':
        return pagination => this.githubIntegrationService.issues(pagination.limit, pagination.page);
      default:
        throw new Error('Invalid entity selected.');
    }
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

  onSearch(grid: GridData): void {
    this.gridApis[grid.id].gridApi.setQuickFilter(grid.searchText);
  }

  onPaginationChange(grid: GridData): void {
    if (this.gridApis[grid.id]) {
      const currentPage = this.gridApis[grid.id].gridApi.paginationGetCurrentPage() + 1; // Convert to 1-based index
      const pageSize = this.gridApis[grid.id].gridApi.paginationGetPageSize();
      grid.pagination.limit = pageSize;
      grid.pagination.page = currentPage;
    }
  }

}
