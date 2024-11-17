import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../../../common/services/auth.service';
import {GithubIntegrationService} from '../../../../common/services/github-integration.service';
import {IJWTTokenDetails} from '../../../../common/models/IToken';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-github-integration',
  templateUrl: './github-integration.component.html',
  styleUrls: ['./github-integration.component.scss']
})
export class GithubIntegrationComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean = false;
  accountDetails: IJWTTokenDetails | null = null;
  isLoading: boolean = false;

  constructor(private route: ActivatedRoute,
              private readonly authService: AuthService,
              private readonly router: Router,
              private readonly githubIntegrationService: GithubIntegrationService,
              private readonly toastrService: ToastrService,) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.isAuthenticated = true;
      this.accountDetails = this.authService.decodeToken();
    }
    // Check if redirected from GitHub with an access token
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.validateIntegrationToken(params['token']);
        this.removeQueryParams({token: null});
      }
    });
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
      if (response.data) {
        this.isAuthenticated = true;
        this.authService.saveToken(token);
        this.accountDetails = this.authService.decodeToken();
      } else {
        this.authService.removeToken();
      }
      this.isLoading = false;
    }, error => {
        this.isLoading = false;
        this.toastrService.error(error.error.error ?? 'Invalid token');
    });
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

  connectToGitHub(): void {
    this.githubIntegrationService.githubAuth();
  }
}
