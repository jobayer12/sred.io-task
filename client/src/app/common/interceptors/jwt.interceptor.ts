import {Inject, Injectable, InjectionToken} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse, HttpHeaders,
} from '@angular/common/http';

import {Observable, throwError} from 'rxjs';
import {Router} from '@angular/router';
import {catchError} from 'rxjs/internal/operators/catchError';
import {timeout} from 'rxjs/internal/operators/timeout';
import {AuthService} from "../services/auth.service";

export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptor implements HttpInterceptor {

  constructor(@Inject(DEFAULT_TIMEOUT) protected defaultTimeout: number,
              private authService: AuthService,
              private router: Router,) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let baseUrl = document.getElementsByTagName('base')[0].href;
    baseUrl = baseUrl.substr(baseUrl.lastIndexOf('/') + 1);
    req = req.clone({ url: `${baseUrl}${req.url}` });
    if (this.authService.getToken() != null) {
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${this.authService.getToken()}`,
        }
      });
      const timeoutValue = req?.headers?.get('timeout') || this.defaultTimeout;
      return next.handle(req).pipe(timeout(1000 * +timeoutValue), catchError((err, caught) => {
        return this.handleAuthError(err);
      }));
    }
    return next.handle(req);
  }

  /**
   * manage errors
   * @param err
   * @returns {any}
   */
  // @ts-ignore
  private handleAuthError(err: HttpErrorResponse): Observable<any> {
    if ([401, 403].includes(err.status)) {
      this.authService.removeToken();
      this.router.navigate(['/']);
    } else {
      // @ts-ignore
      if (err.headers.get('content-type') && err.headers.get('content-type').includes('application/json')) {
        err.error.msg = err.error.message || err.error.msg || 'System error';
      } else {
        if (typeof err.error === 'string') {
          err = new HttpErrorResponse({error: {msg: ''}, headers: new HttpHeaders({'content-type': 'application/json'})});
        }
        err.error.error = 'Invalid content type of response';
      }
      return throwError(err);
    }
  }
}
