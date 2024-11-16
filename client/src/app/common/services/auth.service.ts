import { Injectable } from '@angular/core';
import {JwtHelperService} from "@auth0/angular-jwt";
import {Observable} from "rxjs";
import {IServerResponse} from "../models/IServerResponse";
import {HttpClient} from "@angular/common/http";
import {IAccount} from "../models/IAccount";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  localStorageKey: string = 'github_integration_token';
  jwtHelperService: JwtHelperService = new JwtHelperService();

  constructor(
    private  readonly http: HttpClient,
  ) { }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (token) {
      return !this.jwtHelperService.isTokenExpired(token);
    }
    return false;
  }

  decodeToken(): IAccount | null {
    const token = this.getToken();
    if (token) {
      return <IAccount>this.jwtHelperService.decodeToken(token);
    }
    return null;
  }

  getToken(): string {
    return <string>localStorage.getItem(this.localStorageKey);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.localStorageKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.localStorageKey);
  }

  validate(token: string): Observable<IServerResponse<boolean>> {
    return this.http.get<IServerResponse<boolean>>(`/api/v1/github/verify/${token}`);
  }
}
