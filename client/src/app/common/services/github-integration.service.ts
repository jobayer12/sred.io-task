import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {IServerResponse} from "../models/IServerResponse";
import {Observable} from "rxjs";
import {IGithubRemove} from "../models/IGithubIntegration";

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
}
