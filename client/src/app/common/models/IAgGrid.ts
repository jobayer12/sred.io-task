import {
    ColDef,
    ColGroupDef,
    GridOptions,
    IServerSideDatasource,
    
  } from 'ag-grid-community';
  import { IPagination } from './IGithubIntegration';
  import { ColumnFilter } from './IAgGridColumnFilter';

export type CollectionType = 'projects' | 'commits' | 'pull-requests' | 'issues';

export type GridData = {
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