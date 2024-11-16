import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {IntegrationModule} from "./modules/integration/integration.module";
import {getHttpInterceptorProviders} from "./common/interceptors/interceptor-providers";
import {HttpClientModule} from '@angular/common/http';
import {DEFAULT_TIMEOUT} from "./common/interceptors/jwt.interceptor";
import {ToastrModule} from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true
    }),
    BrowserAnimationsModule,
    IntegrationModule
  ],
  providers: [
    {
      provide: DEFAULT_TIMEOUT,
      useValue: 120 // in second
    },
    getHttpInterceptorProviders(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
