import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { IServerResponse } from "../models/IServerResponse";
import { Observable } from "rxjs";
import { IGithubRepo } from '../models/IGithubRepo';
import { IGithubContributor } from '../models/IGithubContributor';
import { ColumnHttpFilterParams } from '../models/IAgGridColumnFilter';

@Injectable({
  providedIn: 'root'
})
export class GithubIntegrationService {

  constructor(private readonly http: HttpClient) { }

  githubAuth() {
    window.location.href = 'http://localhost:3000/api/v1/github/auth';
  }

  removeIntegration(): Observable<IServerResponse<boolean>> {
    return this.http.delete<IServerResponse<boolean>>(`/api/v1/github/remove`);
  }

  repositoriesByIntegrationId(integrationId: string): Observable<IServerResponse<Array<IGithubRepo>>> {
    return this.http.get<IServerResponse<Array<IGithubRepo>>>(`/api/v1/github/repos/${integrationId}`);
  }

  repositoryActivities(repositoryId: string): Observable<IServerResponse<Array<IGithubContributor>>> {
    return this.http.post<IServerResponse<Array<IGithubContributor>>>(`/api/v1/github/repository-activities`, {
      repositoryId: repositoryId
    });
  }

  repositories(search: string = '', columnFilters: Array<ColumnHttpFilterParams> = [], limit: number = 100, page: number = 1): Observable<IServerResponse<Array<IGithubRepo>>> {
    let params = new HttpParams()
      .set('limit', limit || 100)
      .set('page', page || 1)
    if (search) {
      params = params.append('search', search);
    }
    if (columnFilters.length > 0) {
      columnFilters.forEach((filter, index) => {
        params = params.append(`columnFilters[${index}][filterType]`, filter.filterType);
        params = params.append(`columnFilters[${index}][type]`, filter.type);
        params = params.append(`columnFilters[${index}][key]`, filter.key);

        // Handle `value` dynamically based on its type
        if (Array.isArray(filter.value)) {
          filter.value.forEach((val, i) => {
            params = params.append(`columnFilters[${index}][value][${i}]`, val.toString());
          });
        } else {
          params = params.append(`columnFilters[${index}][value]`, filter.value.toString());
        }
      });
    }
    return this.http.get<IServerResponse<Array<IGithubRepo>>>(`/api/v1/github/repos`, {
      params: params
    });
  }

  pullRequests(search: string = '', columnFilters: Array<ColumnHttpFilterParams> = [], limit: number = 100, page: number = 1): Observable<IServerResponse<Array<any>>> {
    let params = new HttpParams()
      .set('limit', limit || 100)
      .set('page', page || 1)
    if (search) {
      params = params.append('search', search);
    }
    if (columnFilters.length > 0) {
      columnFilters.forEach((filter, index) => {
        params = params.append(`columnFilters[${index}][filterType]`, filter.filterType);
        params = params.append(`columnFilters[${index}][type]`, filter.type);
        params = params.append(`columnFilters[${index}][key]`, filter.key);
        // Handle `value` dynamically based on its type
        if (Array.isArray(filter.value)) {
          filter.value.forEach((val, i) => {
            params = params.append(`columnFilters[${index}][value][${i}]`, val.toString());
          });
        } else {
          params = params.append(`columnFilters[${index}][value]`, filter.value.toString());
        }
      });
    }
    return this.http.get<IServerResponse<Array<any>>>(`/api/v1/github/pull-requests`, {
      params: params
    });
  }

  commits(search: string = '', columnFilters: Array<ColumnHttpFilterParams> = [], limit: number = 100, page: number = 1): Observable<IServerResponse<Array<any>>> {
    let params = new HttpParams()
      .set('limit', limit || 100)
      .set('page', page || 1);

    if (search) {
      params = params.append('search', search);
    }

    if (columnFilters.length > 0) {
      columnFilters.forEach((filter, index) => {
        params = params.append(`columnFilters[${index}][filterType]`, filter.filterType);
        params = params.append(`columnFilters[${index}][type]`, filter.type);
        params = params.append(`columnFilters[${index}][key]`, filter.key);

        // Handle `value` dynamically based on its type
        if (Array.isArray(filter.value)) {
          filter.value.forEach((val, i) => {
            params = params.append(`columnFilters[${index}][value][${i}]`, val.toString());
          });
        } else {
          params = params.append(`columnFilters[${index}][value]`, filter.value.toString());
        }
      });
    }
    return this.http.get<IServerResponse<Array<any>>>(`/api/v1/github/commits`, {
      params: params
    });
  }

  issues(search: string = '', columnFilters: Array<ColumnHttpFilterParams> = [], limit: number = 100, page: number = 1): Observable<IServerResponse<Array<any>>> {
    let params = new HttpParams()
      .set('limit', limit || 100)
      .set('page', page || 1);
    if (search) {
      params = params.append('search', search);
    }
    if (columnFilters.length > 0) {
      columnFilters.forEach((filter, index) => {
        params = params.append(`columnFilters[${index}][filterType]`, filter.filterType);
        params = params.append(`columnFilters[${index}][type]`, filter.type);
        params = params.append(`columnFilters[${index}][key]`, filter.key);

        // Handle `value` dynamically based on its type
        if (Array.isArray(filter.value)) {
          filter.value.forEach((val, i) => {
            params = params.append(`columnFilters[${index}][value][${i}]`, val.toString());
          });
        } else {
          params = params.append(`columnFilters[${index}][value]`, filter.value.toString());
        }
      });
    }
    return this.http.get<IServerResponse<Array<any>>>(`/api/v1/github/issues`, {
      params: params
    });
  }
}
