import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../../../common/services/auth.service';
import {GithubIntegrationService} from '../../../../common/services/github-integration.service';
import {IJWTTokenDetails} from '../../../../common/models/IToken';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { IGithubRepo } from '../../../../common/models/IGithubRepo';
import { ColDef, GridApi, GridOptions, GridReadyEvent, ITooltipParams, RowSelectedEvent, ValueGetterParams } from 'ag-grid-community';
import { IGithubContributor } from '../../../../common/models/IGithubContributor';

@Component({
  selector: 'app-github-integration',
  templateUrl: './github-integration.component.html',
  styleUrls: ['./github-integration.component.scss']
})
export class GithubIntegrationComponent implements OnInit, OnDestroy {
  @ViewChild('gridContainer') gridContainer!: ElementRef;
  @ViewChild('contributorGridContainer') contributorGridContainer!: ElementRef;
  
  isAuthenticated: boolean = false;
  accountDetails: IJWTTokenDetails | null = null;
  isLoading: boolean = false;
  formatDate!: string | null;
  repositories: Array<IGithubRepo> = [];
  gridApi!: GridApi;
  gridOptions!: GridOptions;
  contributorGridApi!: GridApi;
  contributorGridOptions!: GridOptions;
  isAnyRowSelected: boolean = false;

  contributors: Array<IGithubContributor> = [];

  constructor(private route: ActivatedRoute,
              private readonly authService: AuthService,
              private readonly router: Router,
              private readonly githubIntegrationService: GithubIntegrationService,
              private readonly toastrService: ToastrService,
              private readonly datepipe: DatePipe,
            ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.retriveTokenDetails();
    }
    // Check if redirected from GitHub with an access token
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.validateIntegrationToken(params['token']);
        this.removeQueryParams({token: null});
      }
    });
  }

  onResizeGridContainer() {
    if (this.gridContainer) {
      this.gridContainer.nativeElement.style.height = `${300}px`;
      this.gridContainer.nativeElement.style.width = `${750}px`;
    }
  }

  onResizeContributorGridContainer() {
    if (this.contributorGridContainer) {
      this.contributorGridContainer.nativeElement.style.height = `${300}px`;
      this.contributorGridContainer.nativeElement.style.width = `${750}px`;
    }
  }

  private get defaultColDef(): ColDef {
    return {
      resizable: true,
      flex:1,
      minWidth: 100,
    };
  }

  get colDefs(): Array<ColDef> {
    return [
      {
        headerName: 'ID',
        field: 'id',
        flex: 1,
        
        cellRenderer: (params: ValueGetterParams<IGithubRepo>) => {
          return params?.data?.repoId;
        },
      },
      {
        headerName: `Name`,
        field: 'name',
        flex: 1,
        valueGetter: (params: ValueGetterParams<IGithubRepo>) => {
          return params?.data?.name;
        },

      },
      {
        headerName: 'Link',
        field: 'link',
        flex: 1,
        cellRenderer: (params: ValueGetterParams<IGithubRepo>) => {
          return `<a href=${params?.data?.link} target=_blank>${params?.data?.link}</a>`;
        },
        tooltipValueGetter: (params: ITooltipParams<IGithubRepo>) => {
          return params.value;
        }
      },
      {
        headerName: 'Slug',
        field: 'slug',
        flex: 1,
        valueGetter: (params: ValueGetterParams<IGithubRepo>) => {
          return params?.data?.slug;
        },
        tooltipValueGetter: (params: ITooltipParams<IGithubRepo>) => {
          return params.value;
        }
      },
      {
        field: 'included',
        headerName: 'Included',
        checkboxSelection: true
      }
    ]
  }

  private populateGridOptions(): void {
    this.gridOptions = {
      headerHeight: 45,
      defaultColDef: this.defaultColDef,
      columnDefs: this.colDefs,
      rowSelection: 'single',
      suppressMoveWhenRowDragging: true,
      onGridReady: this.onGridReady.bind(this),
      onRowSelected: (event: RowSelectedEvent) => {
        this.isAnyRowSelected = this.gridApi.getSelectedRows().length > 0;
      },
      overlayLoadingTemplate: `<span class="ag-overlay-loading-center">Loading...</span>`,
    };
  }

  onGridReady(params: GridReadyEvent<IGithubRepo>): void {
    this.gridApi = params.api;
    this.loadGithubRepositories();
  }

  removeQueryParams(params: Object): void {
    // Remove query params
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  validateIntegrationToken(token: string): void {
    this.isLoading = true;
    this.authService.validateGithubToken(token).subscribe(response => {
      this.isLoading = false;
      if (response.data) {
        this.authService.saveToken(token);
        this.retriveTokenDetails();
      } else {
        this.authService.removeToken();
      }
    }, error => {
        this.isLoading = false;
        this.toastrService.error(error.error.error ?? 'Invalid token');
    });
  }

  // load github repositories
  loadGithubRepositories(): void {
    this.isLoading = true;
    this.githubIntegrationService.repositories().subscribe(response => {
      this.isLoading = false;
      this.repositories = (response.data && response.data.length > 0) ? response.data : [];
      this.gridApi.setRowData(this.repositories);
      this.onResizeGridContainer();
    }, e => {
      this.isLoading = false;
      this.toastrService.error(e.error.error ?? 'Failed to fetch github repositories');
    });
  }

  retriveTokenDetails(): void {
    this.isAuthenticated = true;
    this.accountDetails = this.authService.decodeToken();
    this.formatDate = this.datepipe.transform(this.accountDetails?.connectedAt, 'yyyy-MM-dd h:mm a');
    this.populateGridOptions();
    this.populateContributorGridOptions();
  }

  ngOnDestroy(): void {

  }

  removeIntegration() {
    this.isLoading = true;
    this.githubIntegrationService.removeIntegration().subscribe(response => {
      if (response.data) {
        this.isAuthenticated = false;
        this.authService.removeToken();
        this.toastrService.success('Github integration removed successfully');
      } else {
        this.toastrService.error('Failed to remove github integration.');
      }
      this.isLoading = false;
    }, err => {
      this.isLoading = false;
      this.toastrService.error(err.error.error ?? 'Failed to remove github integration.');
    });
  }

  get contributorColDefs(): Array<ColDef> {
    return [
      {
        headerName: 'UserID',
        field: 'userId',
        flex: 1,

        cellRenderer: (params: ValueGetterParams<IGithubContributor>) => {
          return params?.data?.userId;
        },
      },
      {
        headerName: `User`,
        field: 'user',
        flex: 1,
        valueGetter: (params: ValueGetterParams<IGithubContributor>) => {
          return params?.data?.user;
        },

      },
      {
        headerName: 'Total Commits',
        field: 'totalCommits',
        flex: 1,
        valueGetter: (params: ValueGetterParams<IGithubContributor>) => {
          return params?.data?.totalCommits;
        },
      },
      {
        headerName: 'Total Pull Requests.',
        field: 'totalPullRequests',
        flex: 1,
        valueGetter: (params: ValueGetterParams<IGithubContributor>) => {
          return params?.data?.totalPullRequests;
        },
      },
      {
        headerName: 'Total Issues',
        field: 'totalIssues',
        flex: 1,
        valueGetter: (params: ValueGetterParams<IGithubContributor>) => {
          return params?.data?.totalIssues;
        },
      }
    ]
  }

  private populateContributorGridOptions(): void {
    this.contributorGridOptions = {
      headerHeight: 45,
      defaultColDef: this.defaultColDef,
      columnDefs: this.contributorColDefs,
      onGridReady: this.onContributorGridReady.bind(this),
      overlayLoadingTemplate: `<span class="ag-overlay-loading-center">Loading...</span>`,
    };
  }

  onContributorGridReady(params: GridReadyEvent<IGithubContributor>): void {
    this.contributorGridApi = params.api;
  }

  fetchSelectedRepoDetails(): void {
    const selectedData: Array<IGithubRepo> =  this.gridApi.getSelectedRows();
    this.isLoading = true;
    this.githubIntegrationService.repositoryActivities(selectedData[0]._id).subscribe(response => {
      this.isLoading = false;
      this.contributors = response.data;
      this.contributorGridApi.setRowData(this.contributors);
      this.onResizeContributorGridContainer();
    }, error => {
      this.isLoading = false;
    });
  }

  connectToGitHub(): void {
    this.githubIntegrationService.githubAuth();
  }

  exportDataAsCsv(): void {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv();
  }
}
