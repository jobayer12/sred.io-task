export interface IServerResponse<T = any> {
  status: number;
  error: string;
  data: T;
}

export interface PaginationReponse {
  pagination: PaginationProperty;
}

export interface PaginationProperty {
  currentPage: number;
  totalCount: number;
  totalItems: number;
  totalPages: number;
}
