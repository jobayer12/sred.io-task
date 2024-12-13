import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {IServerResponse} from "../models/IServerResponse";
import {Observable} from "rxjs";
import {IGithubIntegration, IGithubRemove} from "../models/IGithubIntegration";
import { IGithubRepo } from '../models/IGithubRepo';
import { IGithubContributor } from '../models/IGithubContributor';

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

  repositoriesByIntegrationId(integrationId: string, limit: number = 100, page: number = 0):  Observable<IServerResponse<Array<IGithubRepo>>> {
    return this.http.get<IServerResponse<Array<IGithubRepo>>>(`/api/v1/github/repos/${integrationId}`);
  }

  repositoryActivities(repositoryId: string): Observable<IServerResponse<Array<IGithubContributor>>> {
    return this.http.post<IServerResponse<Array<IGithubContributor>>>(`/api/v1/github/repository-activities`, {
      repositoryId: repositoryId
    });
  }

  repositories(limit: number = 100, page: number = 1): Observable<IServerResponse<Array<IGithubRepo>>> {
    const params = new HttpParams()
            .set('limit', limit.toString())
            .set('page', page.toString());
    return this.http.get<IServerResponse<Array<IGithubRepo>>>(`/api/v1/github/repos`, {
      params: params
    });
  }

  pullRequests(limit: number = 100, page: number = 1): Observable<IServerResponse<Array<any>>> {
    const params = new HttpParams()
            .set('limit', limit.toString())
            .set('page', page.toString());
    return this.http.get<IServerResponse<Array<any>>>(`/api/v1/github/pull-requests`, {
      params: params
    });
  }

  commits(limit: number = 100, page: number = 1): Observable<IServerResponse<Array<any>>> {
    const params = new HttpParams()
            .set('limit', limit.toString())
            .set('page', page.toString());
    return this.http.get<IServerResponse<Array<any>>>(`/api/v1/github/commits`, {
      params: params
    });
  }

  issues(limit: number = 100, page: number = 1): Observable<IServerResponse<Array<any>>> {
    const params = new HttpParams()
            .set('limit', limit.toString())
            .set('page', page.toString());
    return this.http.get<IServerResponse<Array<any>>>(`/api/v1/github/issues`, {
      params: params
    });
  }
}
