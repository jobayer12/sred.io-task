import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {JwtInterceptor} from './jwt.interceptor';

export const getHttpInterceptorProviders = () => {
  const interceptorProviders = [];

  interceptorProviders.push({
    provide: HTTP_INTERCEPTORS,
    useClass: JwtInterceptor,
    multi: true
  });

  return interceptorProviders;
};
