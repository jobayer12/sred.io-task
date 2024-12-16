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
  FilterChangedEvent,
  
} from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import 'ag-grid-enterprise';
import { AuthService } from '../../../../common/services/auth.service';
import { IJWTTokenDetails } from '../../../../common/models/IToken';
import { debounceTime, distinctUntilChanged, filter, Observable, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GlobalSearchDialogComponent } from '../../dialog/global-search-dialog/global-search-dialog.component';
import { IPagination } from '../../../../common/models/IGithubIntegration';
import {
  ServerSideRowModelModule,
  SetFilterModule,
} from 'ag-grid-enterprise';

import { FlattenRowData, GenerateColDef, ProcessColumnFilter } from '../../../../common/utils/utils'
import { ColumnFilter, ColumnHttpFilterParams } from '../../../../common/models/IAgGridColumnFilter';

ModuleRegistry.registerModules([
  SetFilterModule,
  ServerSideRowModelModule,
]);

type CollectionType = 'projects' | 'commits' | 'pull-requests' | 'issues';

type GridData = {
  id: number;
  integrationId: string | undefined;
  columnDefs: Array<ColDef | ColGroupDef>;
  searchText: string,
  gridOptions: GridOptions,
  collection: CollectionType | null,
  pagination: IPagination;
  serverSideDatasource?: IServerSideDatasource | undefined;
  columnFilters: ColumnFilter | null
}

@Component({
  selector: 'app-dynamic-ag-grid-table',
  templateUrl: './dynamic-ag-grid-table.component.html',
  styleUrls: ['./dynamic-ag-grid-table.component.scss']
})
export class DynamicAgGridTableComponent implements OnInit {

  @ViewChild('selectPanel', { static: false }) selectIntegrationPanel!: ElementRef;
  @ViewChild('triggerButton', { static: false }) triggerButton!: ElementRef;
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
  defaultPagination: IPagination = {
    limit: 100,
    page: 1
  }

  // token details
  jwtTokenDetails!: IJWTTokenDetails | null;
  showGlobalSearchForm: boolean = false;
  globalSearchText: string = '';
  lastSearchText: {[key: number]: string} = {};

  private searchSubject = new Subject<{search: string, grid: GridData}>();
  private searchObservable$!: Observable<{search: string, grid: GridData}>;

  constructor(
    private readonly githubIntegrationService: GithubIntegrationService,
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService,
    private dialog: MatDialog
  ) {
    this.searchObservable$ = this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after last typing
      distinctUntilChanged(), // Only emit when the search text changes
      filter((response: { search: string; grid: GridData }) => response.search.length !== 1)
    );

    // Subscribe to handle search
    this.searchObservable$.subscribe((response: {search: string, grid: GridData}) => {
      this.performSearch(response.grid);
    });

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
      sortable: true,
      filter: true,
      resizable: true,
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

  onFilterChanged(event: FilterChangedEvent, grid: GridData): void {
    grid.columnFilters = event.api.getFilterModel();
  }

  addNewGrid() {
    const newGrid: GridData = {
      id: this.grids.length,
      columnDefs: [],
      gridOptions: this.gridOptions,
      integrationId: this.jwtTokenDetails?.id,
      searchText: '',
      collection: null,
      pagination: this.defaultPagination,
      columnFilters: null,
    };
    this.grids.push(newGrid);
  }

  // Delete a specific grid by index
  deleteGrid(index: number) {
    this.grids.splice(index, 1);
  }

  resetFilterModel(grid: GridData): void {
    this.gridApis[grid.id]?.gridApi?.setFilterModel(null);
  }

  onCollectionChange(grid: GridData): void {
    this.resetFilterModel(grid);
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

  private fetchData(apiCall: (search: string, columns: Array<ColumnHttpFilterParams>, pagination: IPagination) => Observable<any>, grid: GridData): void {
    const dataSource: IServerSideDatasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        const columnFilters = ProcessColumnFilter(grid.columnFilters);
        apiCall(grid.searchText, columnFilters, grid.pagination).subscribe(
          (response) => {
            const { data, pagination } = response; // API response structure
            if (data.length > 0) {
              grid.columnDefs = GenerateColDef(data[0]);
            }
            setTimeout(() => {
              params.success({
                rowData: data.map((d: any) => FlattenRowData(d)),
                rowCount: pagination.totalCount || 0,
              });
            }, 200);
          },
          (error) => {
            console.error('Error fetching data:', error);
            this.toastrService.error(error?.error?.error ?? `Failed to load ${grid.collection} data.`);
            params.fail(); // Notify AG-Grid of the failure
          }
        );
      },
    };
  
    grid.serverSideDatasource = dataSource;
  }

  private getApiCall(grid: GridData): (search: string, columnFilter: Array<ColumnHttpFilterParams>, pagination: IPagination) => Observable<any> {
    switch (grid.collection) {
      case 'projects':
        return (search, columnFilter, pagination) => this.githubIntegrationService.repositories(search, columnFilter, pagination.limit, pagination.page);
      case 'commits':
        return (search, columnFilter, pagination) => this.githubIntegrationService.commits(search, columnFilter, pagination.limit, pagination.page);
      case 'pull-requests':
        return (search, columnFilter, pagination) => this.githubIntegrationService.pullRequests(search, columnFilter, pagination.limit, pagination.page);
      case 'issues':
        return (search, columnFilter, pagination) => this.githubIntegrationService.issues(search, columnFilter, pagination.limit, pagination.page);
      default:
        throw new Error('Invalid entity selected.');
    }
  }

  onSearch(grid: GridData): void {
    this.searchSubject.next({search: grid.searchText, grid});
  }

  onPaginationChange(grid: GridData): void {
    if (this.gridApis[grid.id]) {
      const currentPage = this.gridApis[grid.id].gridApi.paginationGetCurrentPage() + 1; // Convert to 1-based index
      const pageSize = this.gridApis[grid.id].gridApi.paginationGetPageSize();
      grid.pagination.limit = pageSize;
      grid.pagination.page = currentPage;
    }
  }

  addNewGlobalSearchGrid(): void {
    this.dialog.open(GlobalSearchDialogComponent, {
      height: 'auto',
      width: 'auto',
      data: this.globalSearchText
    }).afterClosed().subscribe(response => {
      if (response && response?.search && response.search.length > 0) {
        this.globalSearchText = response.search;
        this.grids = [];
        this.grids = this.entityCollections.map((collection, index) => {
          return {
            id: index,
            columnDefs: [],
            gridOptions: this.gridOptions,
            integrationId: this.jwtTokenDetails?.id,
            searchText: this.globalSearchText,
            collection: collection.key,
            pagination: this.defaultPagination,
            columnFilters: null,
          }
        });
        this.grids.forEach(grid => this.onCollectionChange(grid));
      }
    });
  }

  private performSearch(grid: GridData) {
    this.onCollectionChange(grid);
  }

}
